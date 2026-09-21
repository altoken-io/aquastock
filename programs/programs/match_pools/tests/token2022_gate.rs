//! Day-0 gate: prove the program's token flows work against a replica of the mainnet
//! SPYx mint (scaled UI amount, pausable, permanent delegate, default account state,
//! disabled transfer hook, confidential transfer, metadata) on the mainnet Token-2022 build.

mod common;

use {
    anchor_lang::solana_program::system_instruction,
    anchor_spl::token_2022::spl_token_2022::{
        self,
        error::TokenError,
        extension::{
            confidential_transfer::ConfidentialTransferMint,
            default_account_state::DefaultAccountState, pausable::PausableConfig,
            scaled_ui_amount::ScaledUiAmountConfig, transfer_hook::TransferHook,
            BaseStateWithExtensions, ExtensionType, StateWithExtensions,
        },
        state::{AccountState, Mint},
    },
    common::*,
    match_pools::error::MatchPoolsError,
    solana_keypair::Keypair,
    solana_signer::Signer,
};

fn code(error: MatchPoolsError) -> u32 {
    error.into()
}

fn token_code(error: TokenError) -> u32 {
    error as u32
}

#[test]
fn replica_mint_matches_the_mainnet_spyx_shape() {
    let w = World::new();
    let account = w.svm.get_account(&w.mint).unwrap();
    assert_eq!(account.owner, token_2022_id());
    assert_eq!(
        account.data.len(),
        SPYX_MINT_SPACE,
        "replica account size differs from the mainnet SPYx mint"
    );

    let mut actual = w.mint_extension_types(&w.mint);
    actual.sort_by_key(|t| *t as u16);
    let mut expected = vec![
        ExtensionType::MetadataPointer,
        ExtensionType::PermanentDelegate,
        ExtensionType::DefaultAccountState,
        ExtensionType::ScaledUiAmount,
        ExtensionType::Pausable,
        ExtensionType::ConfidentialTransferMint,
        ExtensionType::TransferHook,
        ExtensionType::TokenMetadata,
    ];
    expected.sort_by_key(|t| *t as u16);
    assert_eq!(actual, expected);

    let state = StateWithExtensions::<Mint>::unpack(&account.data).unwrap();
    assert_eq!(state.base.decimals, 8);
    assert!(state.base.freeze_authority.is_some());
    assert_eq!(
        state.get_extension::<DefaultAccountState>().unwrap().state,
        u8::from(AccountState::Initialized)
    );
    assert!(Option::<anchor_lang::prelude::Pubkey>::from(
        state.get_extension::<TransferHook>().unwrap().program_id
    )
    .is_none());
    assert!(!bool::from(
        state.get_extension::<PausableConfig>().unwrap().paused
    ));
    assert!(!bool::from(
        state
            .get_extension::<ConfidentialTransferMint>()
            .unwrap()
            .auto_approve_new_accounts
    ));
}

#[test]
fn create_pool_sizes_the_vault_for_the_mints_account_extensions() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, 0);
    let vault = w.vault_pda(&pool);

    let extensions = w.token_account_extensions(&vault);
    assert!(extensions.contains(&ExtensionType::PausableAccount));
    assert!(extensions.contains(&ExtensionType::TransferHookAccount));
    assert_eq!(w.token_account_state(&vault), AccountState::Initialized);

    let state = w.pool(&pool);
    assert_eq!(state.vault, vault);
    assert_eq!(state.mint, w.mint);
    assert_eq!(state.sponsor, w.sponsor.pubkey());
    assert_eq!(state.budget_total, 0);
}

#[test]
fn deposit_then_withdraw_round_trips_exactly() {
    let mut w = World::new();
    let budget = 500 * ONE;
    let params = w.default_params(1);
    let pool = w.open_pool(params, budget);
    let vault = w.vault_pda(&pool);
    let saver = w.saver_a.pubkey();
    let before = w.balance(&w.saver_a_ata);
    assert_eq!(w.balance(&vault), budget);

    let amount = 40 * ONE;
    w.deposit_as_a(&pool, amount, amount).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata), before - amount);
    assert_eq!(w.balance(&vault), budget + amount);
    let state = w.pool(&pool);
    assert_eq!((state.reserved, state.deposits_total), (amount, amount));
    let position = w.position(&saver, &pool);
    assert_eq!(position.deposited, amount);
    assert_eq!(position.match_reserved, amount);
    assert_eq!(position.started_at, T0);

    // Leaving at the instant of deposit: everything comes back, all match is forfeited.
    w.withdraw_as_a(&pool).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata), before);
    assert_eq!(w.balance(&vault), budget);
    let state = w.pool(&pool);
    assert_eq!(
        (state.reserved, state.deposits_total, state.claimed),
        (0, 0, 0)
    );
    let position = w.position(&saver, &pool);
    assert_eq!((position.deposited, position.match_reserved), (0, 0));
    assert!(position.settled);
}

#[test]
fn paused_mint_blocks_every_transfer_without_changing_state() {
    let mut w = World::new();
    let budget = 500 * ONE;
    let params = w.default_params(1);
    let pool = w.open_pool(params, budget);
    let vault = w.vault_pda(&pool);
    let saver = w.saver_a.pubkey();
    let amount = 40 * ONE;
    w.deposit_as_a(&pool, amount, 0).unwrap();
    w.set_time(T0 + 500);

    let pool_before = w.pool(&pool);
    let position_before = w.position(&saver, &pool);
    let vault_before = w.balance(&vault);
    let saver_before = w.balance(&w.saver_a_ata);
    w.pause(&w.mint.clone()).unwrap();

    // The program refuses up front with its own clear error...
    let paused = code(MatchPoolsError::MintPaused);
    assert!(failed_with(&w.withdraw_as_a(&pool), paused));
    assert!(failed_with(&w.claim_as_a(&pool), paused));
    assert!(failed_with(&w.deposit_as_b(&pool, ONE, 0), paused));
    let sponsor = w.sponsor.pubkey();
    let fund = w.fund_match_ix(&sponsor, &w.sponsor_ata, &pool, ONE);
    assert!(failed_with(
        &send(&mut w.svm, &w.payer, &[fund], &[&w.sponsor]),
        paused
    ));

    // ...and Token-2022 itself would refuse too, which shows the replica really pauses.
    let direct = spl_token_2022::instruction::transfer_checked(
        &token_2022_id(),
        &w.saver_a_ata,
        &w.mint,
        &w.saver_b_ata,
        &saver,
        &[],
        ONE,
        DECIMALS,
    )
    .unwrap();
    let direct = send(&mut w.svm, &w.payer, &[direct], &[&w.saver_a]);
    assert!(failed_with(&direct, token_code(TokenError::MintPaused)));

    // Nothing moved and no bookkeeping changed.
    assert_eq!(w.pool(&pool), pool_before);
    assert_eq!(w.position(&saver, &pool), position_before);
    assert_eq!(w.balance(&vault), vault_before);
    assert_eq!(w.balance(&w.saver_a_ata), saver_before);

    // Funds were stalled, not lost: after resume the saver leaves with everything owed.
    w.resume(&w.mint.clone()).unwrap();
    w.withdraw_as_a(&pool).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata), saver_before + amount);
    let position = w.position(&saver, &pool);
    assert_eq!(position.match_reserved, amount / 2);
}

#[test]
fn multiplier_change_mid_vest_does_not_touch_raw_accounting() {
    let mut w = World::new();
    let budget = 500 * ONE;
    let params = w.default_params(1);
    let pool = w.open_pool(params, budget);
    let vault = w.vault_pda(&pool);
    let amount = 100 * ONE;
    w.deposit_as_a(&pool, amount, amount).unwrap();

    // Halfway through vesting the issuer changes the display multiplier.
    w.set_time(T0 + 500);
    let balance_before = w.balance(&w.saver_a_ata);
    w.update_multiplier(&w.mint.clone(), 1.2, T0 + 500).unwrap();
    assert_eq!(
        w.balance(&w.saver_a_ata),
        balance_before,
        "raw balances must not move when the multiplier changes"
    );
    let mint_account = w.svm.get_account(&w.mint).unwrap();
    let config = *StateWithExtensions::<Mint>::unpack(&mint_account.data)
        .unwrap()
        .get_extension::<ScaledUiAmountConfig>()
        .unwrap();
    assert!((f64::from(config.new_multiplier) - 1.2).abs() < 1e-12);

    // Vesting is in raw units: exactly half of the reserved match, regardless of the multiplier.
    w.claim_as_a(&pool).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata), balance_before + amount / 2);
    assert_eq!(
        w.position(&w.saver_a.pubkey(), &pool).match_claimed,
        amount / 2
    );

    w.set_time(T0 + 1_000);
    w.claim_as_a(&pool).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata), balance_before + amount);
    let state = w.pool(&pool);
    assert_eq!(state.claimed, amount);
    assert_eq!(w.balance(&vault), budget + amount - amount);
}

#[test]
fn issuer_draining_the_vault_fails_withdrawals_cleanly() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, 500 * ONE);
    let vault = w.vault_pda(&pool);
    let saver = w.saver_a.pubkey();
    w.deposit_as_a(&pool, 40 * ONE, 0).unwrap();

    // The permanent delegate can take tokens from any account, including the vault.
    let admin = w.admin.pubkey();
    let mint = w.mint;
    let admin_ata = w.create_token_account(&admin, &mint);
    let drained = w.balance(&vault);
    w.delegate_transfer(&vault, &admin_ata, &mint, drained)
        .unwrap();
    assert_eq!(w.balance(&vault), 0);

    let pool_before = w.pool(&pool);
    let position_before = w.position(&saver, &pool);
    let result = w.withdraw_as_a(&pool);
    assert!(failed_with(
        &result,
        token_code(TokenError::InsufficientFunds)
    ));
    // The whole transaction reverts, so bookkeeping still matches what the saver was promised.
    assert_eq!(w.pool(&pool), pool_before);
    assert_eq!(w.position(&saver, &pool), position_before);
}

#[test]
fn issuer_freezing_the_vault_fails_withdrawals_cleanly() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, 500 * ONE);
    let vault = w.vault_pda(&pool);
    let saver = w.saver_a.pubkey();
    w.deposit_as_a(&pool, 40 * ONE, 0).unwrap();

    w.freeze(&vault, &w.mint.clone()).unwrap();
    let position_before = w.position(&saver, &pool);
    let result = w.withdraw_as_a(&pool);
    assert!(failed_with(&result, token_code(TokenError::AccountFrozen)));
    assert_eq!(w.position(&saver, &pool), position_before);
}

#[test]
fn allow_listing_rejects_mints_this_program_cannot_hold_safely() {
    let cases = [
        (
            "transfer fee",
            MintOptions {
                transfer_fee: true,
                ..MintOptions::default()
            },
            MatchPoolsError::UnsupportedMintExtension,
        ),
        (
            "enabled transfer hook",
            MintOptions {
                hook_program: Some(anchor_lang::prelude::Pubkey::new_unique()),
                ..MintOptions::default()
            },
            MatchPoolsError::TransferHookEnabled,
        ),
        (
            "frozen by default",
            MintOptions {
                default_state: AccountState::Frozen,
                ..MintOptions::default()
            },
            MatchPoolsError::FrozenByDefault,
        ),
        (
            "wrong decimals",
            MintOptions {
                decimals: 6,
                ..MintOptions::default()
            },
            MatchPoolsError::InvalidMintDecimals,
        ),
    ];
    for (label, options, expected) in cases {
        let mut w = World::with_mint(&options, false);
        let result = w.init_config();
        assert!(
            failed_with(&result, code(expected)),
            "{label}: expected {expected:?}, got {:?}\n{}",
            result.as_ref().err().map(|e| &e.err),
            logs(&result)
        );
        assert!(
            w.svm.get_account(&w.config_pda()).is_none(),
            "{label}: config must not exist"
        );
    }
}

#[test]
fn allow_listing_rejects_a_legacy_spl_token_mint() {
    let mut w = World::with_mint(&MintOptions::default(), false);
    let legacy = anchor_spl::token::ID;
    let mint = Keypair::new();
    let ixs = [
        system_instruction::create_account(
            &w.payer.pubkey(),
            &mint.pubkey(),
            w.svm.minimum_balance_for_rent_exemption(82),
            82,
            &legacy,
        ),
        spl_token_2022::instruction::initialize_mint2(
            &legacy,
            &mint.pubkey(),
            &w.mint_authority.pubkey(),
            None,
            DECIMALS,
        )
        .unwrap(),
    ];
    send(&mut w.svm, &w.payer, &ixs, &[&mint]).unwrap();

    // Anchor initialises the config before it checks `mint::token_program`, so the exact
    // error comes from the token program. What matters is that the transaction reverts
    // and leaves nothing behind.
    let ix = w.init_config_ix(&w.upgrade_authority.pubkey(), &mint.pubkey());
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.upgrade_authority]);
    assert!(result.is_err(), "a legacy token mint must not be accepted");
    assert!(w.svm.get_account(&w.config_pda()).is_none());
}

#[test]
fn issuer_enabling_a_hook_after_allow_listing_stops_new_pools_and_transfers() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, 500 * ONE);
    w.deposit_as_a(&pool, 40 * ONE, 0).unwrap();

    // The hook authority can switch a hook on at any time, even though the mint passed the
    // check when it was allow-listed. Transfers would then need accounts we do not pass.
    w.enable_transfer_hook(&w.mint.clone(), anchor_lang::prelude::Pubkey::new_unique())
        .unwrap();

    let hook = code(MatchPoolsError::TransferHookEnabled);
    let sponsor = w.sponsor.pubkey();
    let create = w.create_pool_ix(&sponsor, &w.mint, w.default_params(2));
    assert!(failed_with(
        &send(&mut w.svm, &w.payer, &[create], &[&w.sponsor]),
        hook
    ));
    assert!(failed_with(&w.withdraw_as_a(&pool), hook));
    assert!(failed_with(&w.deposit_as_b(&pool, ONE, 0), hook));
}
