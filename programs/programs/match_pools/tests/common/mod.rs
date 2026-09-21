//! LiteSVM harness: a replica of the mainnet SPYx mint, token accounts, the issuer's
//! powers (pause, freeze, multiplier, permanent delegate, hook), clock control, and a
//! checker for the pool's accounting invariants.
#![allow(dead_code)]
// LiteSVM's failure type is large; boxing it would only add noise to test code.
#![allow(clippy::result_large_err)]

use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::{
            bpf_loader_upgradeable, clock::Clock, instruction::Instruction, system_instruction,
            system_program,
        },
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    anchor_spl::{
        token_2022::spl_token_2022::{
            self,
            extension::{
                confidential_transfer, default_account_state, metadata_pointer, pausable,
                scaled_ui_amount, transfer_fee, transfer_hook, BaseStateWithExtensions,
                ExtensionType, StateWithExtensions,
            },
            state::{Account as TokenAccountState, AccountState, Mint},
        },
        token_2022_extensions::spl_token_metadata_interface::{self, state::TokenMetadata},
    },
    litesvm::{
        types::{FailedTransactionMetadata, TransactionMetadata},
        LiteSVM,
    },
    match_pools::{error::MatchPoolsError, vesting, Config, CreatePoolParams, Pool, Position},
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

pub type TxResult = Result<TransactionMetadata, FailedTransactionMetadata>;

/// Unix time the simulated chain starts at.
pub const T0: i64 = 1_800_000_000;
/// One whole token, in raw units (8 decimals).
pub const ONE: u64 = 100_000_000;
pub const DECIMALS: u8 = 8;

/// Same strings as the mainnet SPYx mint, so the account size can be compared byte for byte.
const SPYX_NAME: &str = "SP500 xStock";
const SPYX_SYMBOL: &str = "SPYx";
const SPYX_URI: &str = "https://xstocks-metadata.backed.fi/tokens/Solana/SPYx/metadata.json";
/// `space` of the mainnet SPYx mint account, read over RPC on 2026-09-19.
pub const SPYX_MINT_SPACE: usize = 676;

pub fn token_2022_id() -> Pubkey {
    spl_token_2022::ID
}

/// Knobs for building mints that differ from the replica, for the negative tests.
#[derive(Clone, Debug)]
pub struct MintOptions {
    pub decimals: u8,
    pub default_state: AccountState,
    pub hook_program: Option<Pubkey>,
    pub transfer_fee: bool,
}

impl Default for MintOptions {
    fn default() -> Self {
        Self {
            decimals: DECIMALS,
            default_state: AccountState::Initialized,
            hook_program: None,
            transfer_fee: false,
        }
    }
}

/// splitmix64: a tiny deterministic generator, so randomized tests need no dependency.
pub struct Rng(pub u64);

impl Rng {
    pub fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }

    pub fn below(&mut self, bound: u64) -> u64 {
        self.next() % bound
    }

    pub fn range(&mut self, low: u64, high_inclusive: u64) -> u64 {
        low + self.below(high_inclusive - low + 1)
    }
}

/// A saver with a token account.
pub struct Actor {
    pub kp: Keypair,
    pub ata: Pubkey,
}

pub struct World {
    pub svm: LiteSVM,
    pub program_id: Pubkey,
    /// Pays fees for every transaction.
    pub payer: Keypair,
    /// The program's upgrade authority, the only key that may call `init_config`.
    pub upgrade_authority: Keypair,
    /// Permanent delegate and metadata, hook and confidential-transfer authority.
    pub admin: Keypair,
    /// Pause and freeze authority.
    pub pauser: Keypair,
    /// Scaled-UI-amount authority.
    pub scaler: Keypair,
    pub mint_authority: Keypair,
    pub sponsor: Keypair,
    pub saver_a: Keypair,
    pub saver_b: Keypair,
    /// Extra savers for the tests that need more than two.
    pub actors: Vec<Actor>,
    pub mint: Pubkey,
    pub sponsor_ata: Pubkey,
    pub saver_a_ata: Pubkey,
    pub saver_b_ata: Pubkey,
}

fn read_artifact(relative: &str, hint: &str) -> Vec<u8> {
    let path = format!("{}/{}", env!("CARGO_MANIFEST_DIR"), relative);
    std::fs::read(&path).unwrap_or_else(|_| panic!("missing {path}: {hint}"))
}

pub fn send(
    svm: &mut LiteSVM,
    payer: &Keypair,
    ixs: &[Instruction],
    extra: &[&Keypair],
) -> TxResult {
    let mut signers: Vec<&Keypair> = vec![payer];
    for kp in extra {
        if !signers.iter().any(|s| s.pubkey() == kp.pubkey()) {
            signers.push(kp);
        }
    }
    let msg = Message::new_with_blockhash(ixs, Some(&payer.pubkey()), &svm.latest_blockhash());
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &signers).unwrap();
    let result = svm.send_transaction(tx);
    // Identical transactions in one blockhash are deduplicated, so move on every time.
    svm.expire_blockhash();
    result
}

/// True when the failure is exactly this custom error code.
pub fn failed_with(result: &TxResult, code: u32) -> bool {
    match result {
        Err(e) => format!("{:?}", e.err).contains(&format!("Custom({code})")),
        Ok(_) => false,
    }
}

pub fn logs(result: &TxResult) -> String {
    match result {
        Ok(m) => m.logs.join("\n"),
        Err(e) => e.meta.logs.join("\n"),
    }
}

/// Asserts the transaction failed with exactly this program error.
#[track_caller]
pub fn expect_err(result: &TxResult, error: MatchPoolsError) {
    let code: u32 = error.into();
    assert!(
        failed_with(result, code),
        "expected {error:?} (Custom({code})), got {:?}\n{}",
        result.as_ref().err().map(|e| &e.err),
        logs(result)
    );
}

/// Asserts the transaction failed with exactly this Anchor framework error.
#[track_caller]
pub fn expect_anchor_err(result: &TxResult, error: anchor_lang::error::ErrorCode) {
    let code: u32 = error.into();
    assert!(
        failed_with(result, code),
        "expected {error:?} (Custom({code})), got {:?}\n{}",
        result.as_ref().err().map(|e| &e.err),
        logs(result)
    );
}

impl World {
    /// A deployment ready to use: program and mainnet Token-2022 loaded, funded actors, a
    /// replica SPYx mint with tokens minted out, and `init_config` done for that mint.
    pub fn new() -> Self {
        let mut world = Self::with_mint(&MintOptions::default(), true);
        world.init_config().unwrap();
        world
    }

    /// Like `new` but without `init_config`, and optionally without minting tokens (some
    /// negative-test mints cannot hold balances).
    pub fn with_mint(options: &MintOptions, fund: bool) -> Self {
        let mut svm = LiteSVM::new();
        let program_id = match_pools::id();
        let upgrade_authority = Keypair::new();
        svm.add_program(
            program_id,
            &read_artifact(
                "../../target/deploy/match_pools.so",
                "run `pnpm program:build` first",
            ),
        )
        .unwrap();
        // LiteSVM deploys upgradeable programs. Give the programdata a known upgrade
        // authority: header is a 4-byte tag, 8-byte slot, then Option<Pubkey>.
        let program_data = program_data_address(&program_id);
        let mut account = svm.get_account(&program_data).unwrap();
        account.data[12] = 1;
        account.data[13..45].copy_from_slice(upgrade_authority.pubkey().as_ref());
        svm.set_account(program_data, account).unwrap();

        // Prefer the mainnet build of Token-2022; LiteSVM's bundled one is older.
        let token_2022 = read_artifact(
            "tests/fixtures/token2022_mainnet.so",
            "run `pnpm program:fixtures` to fetch it",
        );
        svm.add_program(token_2022_id(), &token_2022).unwrap();
        // The program account points at a programdata account whose ELF follows a
        // 45-byte header.
        let program_account = svm.get_account(&token_2022_id()).unwrap();
        let token_data = Pubkey::try_from(&program_account.data[4..36]).unwrap();
        let deployed = svm.get_account(&token_data).unwrap();
        assert_eq!(
            &deployed.data[45..45 + token_2022.len()],
            token_2022.as_slice(),
            "the mainnet Token-2022 build did not replace LiteSVM's bundled one"
        );

        let mut world = World {
            svm,
            program_id,
            payer: Keypair::new(),
            upgrade_authority,
            admin: Keypair::new(),
            pauser: Keypair::new(),
            scaler: Keypair::new(),
            mint_authority: Keypair::new(),
            sponsor: Keypair::new(),
            saver_a: Keypair::new(),
            saver_b: Keypair::new(),
            actors: vec![],
            mint: Pubkey::default(),
            sponsor_ata: Pubkey::default(),
            saver_a_ata: Pubkey::default(),
            saver_b_ata: Pubkey::default(),
        };
        world.set_time(T0);
        for kp in [
            &world.payer,
            &world.upgrade_authority,
            &world.admin,
            &world.pauser,
            &world.scaler,
            &world.mint_authority,
            &world.sponsor,
            &world.saver_a,
            &world.saver_b,
        ] {
            world.svm.airdrop(&kp.pubkey(), 100_000_000_000).unwrap();
        }

        world.mint = world.create_mint(options);
        if fund {
            let mint = world.mint;
            let (sponsor, a, b) = (
                world.sponsor.pubkey(),
                world.saver_a.pubkey(),
                world.saver_b.pubkey(),
            );
            world.sponsor_ata = world.create_token_account(&sponsor, &mint);
            world.saver_a_ata = world.create_token_account(&a, &mint);
            world.saver_b_ata = world.create_token_account(&b, &mint);
            let (sponsor_ata, a_ata, b_ata) =
                (world.sponsor_ata, world.saver_a_ata, world.saver_b_ata);
            world.mint_tokens(&mint, &sponsor_ata, 10_000 * ONE);
            world.mint_tokens(&mint, &a_ata, 1_000 * ONE);
            world.mint_tokens(&mint, &b_ata, 1_000 * ONE);
        }
        world
    }

    /// Adds a funded saver and returns its index in `actors`.
    pub fn add_actor(&mut self, tokens: u64) -> usize {
        let kp = Keypair::new();
        self.svm.airdrop(&kp.pubkey(), 10_000_000_000).unwrap();
        let mint = self.mint;
        let ata = self.create_token_account(&kp.pubkey(), &mint);
        if tokens > 0 {
            self.mint_tokens(&mint, &ata, tokens);
        }
        self.actors.push(Actor { kp, ata });
        self.actors.len() - 1
    }

    // ---- time ----

    pub fn set_time(&mut self, unix_timestamp: i64) {
        let mut clock = self.svm.get_sysvar::<Clock>();
        clock.unix_timestamp = unix_timestamp;
        clock.slot += 1;
        self.svm.set_sysvar(&clock);
        self.svm.expire_blockhash();
    }

    pub fn now(&self) -> i64 {
        self.svm.get_sysvar::<Clock>().unix_timestamp
    }

    // ---- sending ----

    pub fn send(&mut self, ixs: &[Instruction], extra: &[&Keypair]) -> TxResult {
        send(&mut self.svm, &self.payer, ixs, extra)
    }

    // ---- mint and token accounts ----

    /// Builds a Token-2022 mint with the extension set of the mainnet SPYx mint.
    pub fn create_mint(&mut self, options: &MintOptions) -> Pubkey {
        let program = token_2022_id();
        let mint = Keypair::new();
        let admin = self.admin.pubkey();
        let pauser = self.pauser.pubkey();

        let mut extensions = vec![
            ExtensionType::MetadataPointer,
            ExtensionType::PermanentDelegate,
            ExtensionType::DefaultAccountState,
            ExtensionType::ScaledUiAmount,
            ExtensionType::Pausable,
            ExtensionType::TransferHook,
        ];
        // Token-2022 rejects a fee mint that has confidential transfers but no confidential
        // fee config, so the fee variant is built without the confidential extension.
        let confidential = !options.transfer_fee;
        if confidential {
            extensions.push(ExtensionType::ConfidentialTransferMint);
        }
        if options.transfer_fee {
            extensions.push(ExtensionType::TransferFeeConfig);
        }
        let base_space = ExtensionType::try_calculate_account_len::<Mint>(&extensions).unwrap();
        let metadata = TokenMetadata {
            update_authority: Some(admin).try_into().unwrap(),
            mint: mint.pubkey(),
            name: SPYX_NAME.to_string(),
            symbol: SPYX_SYMBOL.to_string(),
            uri: SPYX_URI.to_string(),
            additional_metadata: vec![],
        };
        // The metadata is variable length and is added by a realloc after init, so the
        // account is funded for its final size up front.
        let lamports = self
            .svm
            .minimum_balance_for_rent_exemption(base_space + metadata.tlv_size_of().unwrap());

        let mut ixs = vec![
            system_instruction::create_account(
                &self.payer.pubkey(),
                &mint.pubkey(),
                lamports,
                base_space as u64,
                &program,
            ),
            metadata_pointer::instruction::initialize(
                &program,
                &mint.pubkey(),
                Some(admin),
                Some(mint.pubkey()),
            )
            .unwrap(),
            spl_token_2022::instruction::initialize_permanent_delegate(
                &program,
                &mint.pubkey(),
                &admin,
            )
            .unwrap(),
            default_account_state::instruction::initialize_default_account_state(
                &program,
                &mint.pubkey(),
                &options.default_state,
            )
            .unwrap(),
            scaled_ui_amount::instruction::initialize(
                &program,
                &mint.pubkey(),
                Some(self.scaler.pubkey()),
                1.003909240011759,
            )
            .unwrap(),
            pausable::instruction::initialize(&program, &mint.pubkey(), &pauser).unwrap(),
            transfer_hook::instruction::initialize(
                &program,
                &mint.pubkey(),
                Some(admin),
                options.hook_program,
            )
            .unwrap(),
        ];
        if confidential {
            ixs.push(
                confidential_transfer::instruction::initialize_mint(
                    &program,
                    &mint.pubkey(),
                    Some(admin),
                    false,
                    None,
                )
                .unwrap(),
            );
        }
        if options.transfer_fee {
            ixs.push(
                transfer_fee::instruction::initialize_transfer_fee_config(
                    &program,
                    &mint.pubkey(),
                    Some(&admin),
                    Some(&admin),
                    100,
                    u64::MAX,
                )
                .unwrap(),
            );
        }
        ixs.push(
            spl_token_2022::instruction::initialize_mint2(
                &program,
                &mint.pubkey(),
                &self.mint_authority.pubkey(),
                Some(&pauser),
                options.decimals,
            )
            .unwrap(),
        );
        ixs.push(spl_token_metadata_interface::instruction::initialize(
            &program,
            &mint.pubkey(),
            &admin,
            &mint.pubkey(),
            &self.mint_authority.pubkey(),
            SPYX_NAME.to_string(),
            SPYX_SYMBOL.to_string(),
            SPYX_URI.to_string(),
        ));

        send(
            &mut self.svm,
            &self.payer,
            &ixs,
            &[&mint, &self.mint_authority],
        )
        .unwrap();
        mint.pubkey()
    }

    pub fn mint_extension_types(&self, mint: &Pubkey) -> Vec<ExtensionType> {
        let account = self.svm.get_account(mint).unwrap();
        StateWithExtensions::<Mint>::unpack(&account.data)
            .unwrap()
            .get_extension_types()
            .unwrap()
    }

    /// A plain (non-associated) token account, sized for the mint's required extensions.
    pub fn create_token_account(&mut self, owner: &Pubkey, mint: &Pubkey) -> Pubkey {
        let program = token_2022_id();
        let account = Keypair::new();
        let required =
            ExtensionType::get_required_init_account_extensions(&self.mint_extension_types(mint));
        let space =
            ExtensionType::try_calculate_account_len::<TokenAccountState>(&required).unwrap();
        let lamports = self.svm.minimum_balance_for_rent_exemption(space);
        let ixs = [
            system_instruction::create_account(
                &self.payer.pubkey(),
                &account.pubkey(),
                lamports,
                space as u64,
                &program,
            ),
            spl_token_2022::instruction::initialize_account3(
                &program,
                &account.pubkey(),
                mint,
                owner,
            )
            .unwrap(),
        ];
        self.send(&ixs, &[&account]).unwrap();
        account.pubkey()
    }

    pub fn mint_tokens(&mut self, mint: &Pubkey, to: &Pubkey, amount: u64) {
        let ix = spl_token_2022::instruction::mint_to_checked(
            &token_2022_id(),
            mint,
            to,
            &self.mint_authority.pubkey(),
            &[],
            amount,
            DECIMALS,
        )
        .unwrap();
        send(&mut self.svm, &self.payer, &[ix], &[&self.mint_authority]).unwrap();
    }

    pub fn balance(&self, token_account: &Pubkey) -> u64 {
        let account = self.svm.get_account(token_account).unwrap();
        StateWithExtensions::<TokenAccountState>::unpack(&account.data)
            .unwrap()
            .base
            .amount
    }

    pub fn token_account_state(&self, token_account: &Pubkey) -> AccountState {
        let account = self.svm.get_account(token_account).unwrap();
        StateWithExtensions::<TokenAccountState>::unpack(&account.data)
            .unwrap()
            .base
            .state
    }

    pub fn token_account_extensions(&self, token_account: &Pubkey) -> Vec<ExtensionType> {
        let account = self.svm.get_account(token_account).unwrap();
        StateWithExtensions::<TokenAccountState>::unpack(&account.data)
            .unwrap()
            .get_extension_types()
            .unwrap()
    }

    // ---- issuer powers ----

    pub fn pause(&mut self, mint: &Pubkey) -> TxResult {
        let ix = pausable::instruction::pause(&token_2022_id(), mint, &self.pauser.pubkey(), &[])
            .unwrap();
        send(&mut self.svm, &self.payer, &[ix], &[&self.pauser])
    }

    pub fn resume(&mut self, mint: &Pubkey) -> TxResult {
        let ix = pausable::instruction::resume(&token_2022_id(), mint, &self.pauser.pubkey(), &[])
            .unwrap();
        send(&mut self.svm, &self.payer, &[ix], &[&self.pauser])
    }

    pub fn update_multiplier(
        &mut self,
        mint: &Pubkey,
        multiplier: f64,
        effective: i64,
    ) -> TxResult {
        let ix = scaled_ui_amount::instruction::update_multiplier(
            &token_2022_id(),
            mint,
            &self.scaler.pubkey(),
            &[],
            multiplier,
            effective,
        )
        .unwrap();
        send(&mut self.svm, &self.payer, &[ix], &[&self.scaler])
    }

    /// The issuer turns on a transfer hook after the mint was allow-listed.
    pub fn enable_transfer_hook(&mut self, mint: &Pubkey, hook_program: Pubkey) -> TxResult {
        let ix = transfer_hook::instruction::update(
            &token_2022_id(),
            mint,
            &self.admin.pubkey(),
            &[],
            Some(hook_program),
        )
        .unwrap();
        send(&mut self.svm, &self.payer, &[ix], &[&self.admin])
    }

    pub fn freeze(&mut self, token_account: &Pubkey, mint: &Pubkey) -> TxResult {
        let ix = spl_token_2022::instruction::freeze_account(
            &token_2022_id(),
            token_account,
            mint,
            &self.pauser.pubkey(),
            &[],
        )
        .unwrap();
        send(&mut self.svm, &self.payer, &[ix], &[&self.pauser])
    }

    /// The permanent delegate moves tokens out of any account, whoever owns it.
    pub fn delegate_transfer(
        &mut self,
        from: &Pubkey,
        to: &Pubkey,
        mint: &Pubkey,
        amount: u64,
    ) -> TxResult {
        let ix = spl_token_2022::instruction::transfer_checked(
            &token_2022_id(),
            from,
            mint,
            to,
            &self.admin.pubkey(),
            &[],
            amount,
            DECIMALS,
        )
        .unwrap();
        send(&mut self.svm, &self.payer, &[ix], &[&self.admin])
    }

    // ---- program addresses ----

    pub fn config_pda(&self) -> Pubkey {
        Pubkey::find_program_address(&[match_pools::CONFIG_SEED], &self.program_id).0
    }

    pub fn pool_pda(&self, sponsor: &Pubkey, pool_id: u64) -> Pubkey {
        Pubkey::find_program_address(
            &[
                match_pools::POOL_SEED,
                sponsor.as_ref(),
                &pool_id.to_le_bytes(),
            ],
            &self.program_id,
        )
        .0
    }

    pub fn vault_pda(&self, pool: &Pubkey) -> Pubkey {
        Pubkey::find_program_address(&[match_pools::VAULT_SEED, pool.as_ref()], &self.program_id).0
    }

    pub fn position_pda(&self, pool: &Pubkey, saver: &Pubkey) -> Pubkey {
        Pubkey::find_program_address(
            &[match_pools::POSITION_SEED, pool.as_ref(), saver.as_ref()],
            &self.program_id,
        )
        .0
    }

    // ---- program instructions ----

    fn ix(&self, data: Vec<u8>, accounts: Vec<anchor_lang::prelude::AccountMeta>) -> Instruction {
        Instruction::new_with_bytes(self.program_id, &data, accounts)
    }

    pub fn init_config_ix(&self, authority: &Pubkey, mint: &Pubkey) -> Instruction {
        self.ix(
            match_pools::instruction::InitConfig {}.data(),
            match_pools::accounts::InitConfig {
                authority: *authority,
                config: self.config_pda(),
                mint: *mint,
                program: self.program_id,
                program_data: program_data_address(&self.program_id),
                token_program: token_2022_id(),
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        )
    }

    /// Allow-lists this world's mint, signed by the upgrade authority.
    pub fn init_config(&mut self) -> TxResult {
        let ix = self.init_config_ix(&self.upgrade_authority.pubkey(), &self.mint);
        send(
            &mut self.svm,
            &self.payer,
            &[ix],
            &[&self.upgrade_authority],
        )
    }

    pub fn create_pool_ix(
        &self,
        sponsor: &Pubkey,
        mint: &Pubkey,
        params: CreatePoolParams,
    ) -> Instruction {
        let pool = self.pool_pda(sponsor, params.pool_id);
        self.ix(
            match_pools::instruction::CreatePool { params }.data(),
            match_pools::accounts::CreatePool {
                sponsor: *sponsor,
                mint: *mint,
                config: self.config_pda(),
                pool,
                vault: self.vault_pda(&pool),
                token_program: token_2022_id(),
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        )
    }

    pub fn fund_match_ix(
        &self,
        sponsor: &Pubkey,
        sponsor_ata: &Pubkey,
        pool: &Pubkey,
        amount: u64,
    ) -> Instruction {
        self.ix(
            match_pools::instruction::FundMatch { amount }.data(),
            match_pools::accounts::FundMatch {
                sponsor: *sponsor,
                pool: *pool,
                mint: self.mint,
                vault: self.vault_pda(pool),
                sponsor_token_account: *sponsor_ata,
                token_program: token_2022_id(),
            }
            .to_account_metas(None),
        )
    }

    pub fn deposit_ix(
        &self,
        saver: &Pubkey,
        saver_ata: &Pubkey,
        pool: &Pubkey,
        amount: u64,
        min_match: u64,
    ) -> Instruction {
        self.ix(
            match_pools::instruction::Deposit { amount, min_match }.data(),
            match_pools::accounts::Deposit {
                saver: *saver,
                pool: *pool,
                position: self.position_pda(pool, saver),
                mint: self.mint,
                vault: self.vault_pda(pool),
                saver_token_account: *saver_ata,
                token_program: token_2022_id(),
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        )
    }

    /// `position` is explicit so tests can hand one saver another saver's position.
    pub fn claim_ix_raw(
        &self,
        saver: &Pubkey,
        saver_ata: &Pubkey,
        pool: &Pubkey,
        position: &Pubkey,
    ) -> Instruction {
        self.ix(
            match_pools::instruction::ClaimVested {}.data(),
            match_pools::accounts::ClaimVested {
                saver: *saver,
                pool: *pool,
                position: *position,
                mint: self.mint,
                vault: self.vault_pda(pool),
                saver_token_account: *saver_ata,
                token_program: token_2022_id(),
            }
            .to_account_metas(None),
        )
    }

    pub fn claim_ix(&self, saver: &Pubkey, saver_ata: &Pubkey, pool: &Pubkey) -> Instruction {
        self.claim_ix_raw(saver, saver_ata, pool, &self.position_pda(pool, saver))
    }

    pub fn withdraw_ix_raw(
        &self,
        saver: &Pubkey,
        saver_ata: &Pubkey,
        pool: &Pubkey,
        position: &Pubkey,
    ) -> Instruction {
        self.ix(
            match_pools::instruction::Withdraw {}.data(),
            match_pools::accounts::Withdraw {
                saver: *saver,
                pool: *pool,
                position: *position,
                mint: self.mint,
                vault: self.vault_pda(pool),
                saver_token_account: *saver_ata,
                token_program: token_2022_id(),
            }
            .to_account_metas(None),
        )
    }

    pub fn withdraw_ix(&self, saver: &Pubkey, saver_ata: &Pubkey, pool: &Pubkey) -> Instruction {
        self.withdraw_ix_raw(saver, saver_ata, pool, &self.position_pda(pool, saver))
    }

    pub fn reclaim_ix(&self, sponsor: &Pubkey, sponsor_ata: &Pubkey, pool: &Pubkey) -> Instruction {
        self.ix(
            match_pools::instruction::ReclaimUnmatched {}.data(),
            match_pools::accounts::ReclaimUnmatched {
                sponsor: *sponsor,
                pool: *pool,
                mint: self.mint,
                vault: self.vault_pda(pool),
                sponsor_token_account: *sponsor_ata,
                token_program: token_2022_id(),
            }
            .to_account_metas(None),
        )
    }

    pub fn close_position_ix_raw(
        &self,
        saver: &Pubkey,
        pool: &Pubkey,
        position: &Pubkey,
    ) -> Instruction {
        self.ix(
            match_pools::instruction::ClosePosition {}.data(),
            match_pools::accounts::ClosePosition {
                saver: *saver,
                pool: *pool,
                position: *position,
            }
            .to_account_metas(None),
        )
    }

    pub fn close_position_ix(&self, saver: &Pubkey, pool: &Pubkey) -> Instruction {
        self.close_position_ix_raw(saver, pool, &self.position_pda(pool, saver))
    }

    // ---- program state ----

    pub fn config(&self) -> Config {
        let account = self.svm.get_account(&self.config_pda()).expect("config");
        Config::try_deserialize(&mut account.data.as_slice()).unwrap()
    }

    pub fn pool(&self, pool: &Pubkey) -> Pool {
        let account = self.svm.get_account(pool).expect("pool account");
        Pool::try_deserialize(&mut account.data.as_slice()).unwrap()
    }

    pub fn try_position(&self, saver: &Pubkey, pool: &Pubkey) -> Option<Position> {
        let account = self.svm.get_account(&self.position_pda(pool, saver))?;
        if account.data.is_empty() {
            return None;
        }
        Some(Position::try_deserialize(&mut account.data.as_slice()).unwrap())
    }

    pub fn position(&self, saver: &Pubkey, pool: &Pubkey) -> Position {
        self.try_position(saver, pool).expect("position account")
    }

    // ---- scenario helpers ----

    /// A 1:1 pool with a 100-token per-saver cap, 1000s vesting and a 1-day window.
    pub fn default_params(&self, pool_id: u64) -> CreatePoolParams {
        CreatePoolParams {
            pool_id,
            match_bps: 10_000,
            per_saver_cap: 100 * ONE,
            vesting_seconds: 1_000,
            ends_at: self.now() + 86_400,
        }
    }

    /// Creates a pool for the sponsor and funds it with `budget`.
    pub fn open_pool(&mut self, params: CreatePoolParams, budget: u64) -> Pubkey {
        let sponsor = self.sponsor.pubkey();
        let ix = self.create_pool_ix(&sponsor, &self.mint, params);
        send(&mut self.svm, &self.payer, &[ix], &[&self.sponsor]).unwrap();
        let pool = self.pool_pda(&sponsor, params.pool_id);
        if budget > 0 {
            self.fund(&pool, budget).unwrap();
        }
        pool
    }

    pub fn fund(&mut self, pool: &Pubkey, amount: u64) -> TxResult {
        let ix = self.fund_match_ix(&self.sponsor.pubkey(), &self.sponsor_ata, pool, amount);
        send(&mut self.svm, &self.payer, &[ix], &[&self.sponsor])
    }

    pub fn reclaim(&mut self, pool: &Pubkey) -> TxResult {
        let ix = self.reclaim_ix(&self.sponsor.pubkey(), &self.sponsor_ata, pool);
        send(&mut self.svm, &self.payer, &[ix], &[&self.sponsor])
    }

    pub fn deposit_as_a(&mut self, pool: &Pubkey, amount: u64, min_match: u64) -> TxResult {
        let ix = self.deposit_ix(
            &self.saver_a.pubkey(),
            &self.saver_a_ata,
            pool,
            amount,
            min_match,
        );
        send(&mut self.svm, &self.payer, &[ix], &[&self.saver_a])
    }

    pub fn deposit_as_b(&mut self, pool: &Pubkey, amount: u64, min_match: u64) -> TxResult {
        let ix = self.deposit_ix(
            &self.saver_b.pubkey(),
            &self.saver_b_ata,
            pool,
            amount,
            min_match,
        );
        send(&mut self.svm, &self.payer, &[ix], &[&self.saver_b])
    }

    pub fn claim_as_a(&mut self, pool: &Pubkey) -> TxResult {
        let ix = self.claim_ix(&self.saver_a.pubkey(), &self.saver_a_ata, pool);
        send(&mut self.svm, &self.payer, &[ix], &[&self.saver_a])
    }

    pub fn withdraw_as_a(&mut self, pool: &Pubkey) -> TxResult {
        let ix = self.withdraw_ix(&self.saver_a.pubkey(), &self.saver_a_ata, pool);
        send(&mut self.svm, &self.payer, &[ix], &[&self.saver_a])
    }

    pub fn close_as_a(&mut self, pool: &Pubkey) -> TxResult {
        let ix = self.close_position_ix(&self.saver_a.pubkey(), pool);
        send(&mut self.svm, &self.payer, &[ix], &[&self.saver_a])
    }

    // ---- the same operations for `actors` ----

    pub fn actor_key(&self, index: usize) -> Pubkey {
        self.actors[index].kp.pubkey()
    }

    pub fn deposit_by(&mut self, index: usize, pool: &Pubkey, amount: u64, min: u64) -> TxResult {
        let actor = &self.actors[index];
        let ix = self.deposit_ix(&actor.kp.pubkey(), &actor.ata, pool, amount, min);
        send(&mut self.svm, &self.payer, &[ix], &[&self.actors[index].kp])
    }

    pub fn claim_by(&mut self, index: usize, pool: &Pubkey) -> TxResult {
        let actor = &self.actors[index];
        let ix = self.claim_ix(&actor.kp.pubkey(), &actor.ata, pool);
        send(&mut self.svm, &self.payer, &[ix], &[&self.actors[index].kp])
    }

    pub fn withdraw_by(&mut self, index: usize, pool: &Pubkey) -> TxResult {
        let actor = &self.actors[index];
        let ix = self.withdraw_ix(&actor.kp.pubkey(), &actor.ata, pool);
        send(&mut self.svm, &self.payer, &[ix], &[&self.actors[index].kp])
    }

    pub fn close_by(&mut self, index: usize, pool: &Pubkey) -> TxResult {
        let ix = self.close_position_ix(&self.actors[index].kp.pubkey(), pool);
        send(&mut self.svm, &self.payer, &[ix], &[&self.actors[index].kp])
    }

    // ---- invariants ----

    /// Asserts the pool's accounting identities against the chain. `savers` lists every
    /// wallet that may hold a position. Only the program moves vault funds here, so the
    /// vault balance must match the books exactly.
    #[track_caller]
    pub fn assert_pool_invariants(&self, pool: &Pubkey, savers: &[Pubkey]) {
        let state = self.pool(pool);
        let vault = self.balance(&self.vault_pda(pool));

        assert!(state.reserved <= state.budget_total, "reserved > budget");
        assert!(state.claimed <= state.reserved, "claimed > reserved");
        assert_eq!(
            vault,
            state.budget_total - state.claimed + state.deposits_total,
            "vault balance disagrees with the books"
        );

        let now = self.now();
        let (mut deposited, mut outstanding) = (0u64, 0u64);
        for saver in savers {
            let Some(position) = self.try_position(saver, pool) else {
                continue;
            };
            assert!(
                position.match_claimed <= position.match_reserved,
                "claimed > reserved on a position"
            );
            assert!(
                position.deposited <= state.per_saver_cap,
                "position over the cap"
            );
            if position.settled {
                assert_eq!(
                    position.deposited, 0,
                    "settled position still holds principal"
                );
            } else {
                let vested = vesting::vested_amount(
                    position.match_reserved,
                    position.started_at,
                    state.vesting_seconds,
                    now,
                )
                .unwrap();
                assert!(vested >= position.match_claimed, "claimed ahead of vesting");
            }
            deposited += position.deposited;
            outstanding += position.match_reserved - position.match_claimed;
        }
        // Closed positions are always fully settled, so they contribute nothing to either.
        assert_eq!(deposited, state.deposits_total, "principal does not add up");
        assert_eq!(
            outstanding,
            state.reserved - state.claimed,
            "owed match does not add up"
        );
    }
}

pub fn program_data_address(program_id: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[program_id.as_ref()], &bpf_loader_upgradeable::id()).0
}
