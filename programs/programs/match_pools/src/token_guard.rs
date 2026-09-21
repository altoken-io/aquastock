//! Mint validation for Token-2022 index stocks.
//!
//! Extensions a mint may carry, and why each is safe for this program:
//! - `ScaledUiAmount`: only changes how balances are displayed. Raw amounts never
//!   change, and deposit and match are the same mint, so no arithmetic here reads it.
//! - `Pausable`: the issuer can stall transfers, so withdrawals can stall. Funds are
//!   not lost, and the paused state is checked up front for a clear error.
//! - `PermanentDelegate`: the issuer can move tokens out of any account, including the
//!   vault. The program cannot prevent this; the UI discloses it.
//! - `DefaultAccountState`: accepted only as `Initialized`. A frozen default would
//!   create a vault nobody can spend from.
//! - `TransferHook`: accepted only while its program id is unset, because an enabled
//!   hook needs extra accounts on every transfer that these instructions do not pass.
//! - `MetadataPointer`, `TokenMetadata`: cosmetic.
//! - `ConfidentialTransferMint`: confidential transfers are opt-in per token account,
//!   and this program only issues plain `transfer_checked`.
//!
//! Any other extension is rejected, in particular `TransferFeeConfig`, which would make
//! the vault receive less than the accounting records.

use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::{
    extension::{
        default_account_state::DefaultAccountState, pausable::PausableConfig,
        transfer_hook::TransferHook, BaseStateWithExtensions, ExtensionType, StateWithExtensions,
    },
    state::{AccountState, Mint},
};

use crate::{constants::MINT_DECIMALS, error::MatchPoolsError};

const ACCEPTED_EXTENSIONS: [ExtensionType; 8] = [
    ExtensionType::ScaledUiAmount,
    ExtensionType::Pausable,
    ExtensionType::PermanentDelegate,
    ExtensionType::DefaultAccountState,
    ExtensionType::TransferHook,
    ExtensionType::MetadataPointer,
    ExtensionType::TokenMetadata,
    ExtensionType::ConfidentialTransferMint,
];

/// Full mint check, run once when a pool is created.
pub fn validate_pool_mint(mint: &AccountInfo) -> Result<()> {
    let data = mint.try_borrow_data()?;
    let state = StateWithExtensions::<Mint>::unpack(&data)?;
    require_eq!(
        state.base.decimals,
        MINT_DECIMALS,
        MatchPoolsError::InvalidMintDecimals
    );

    let types = state.get_extension_types()?;
    for extension in &types {
        require!(
            ACCEPTED_EXTENSIONS.contains(extension),
            MatchPoolsError::UnsupportedMintExtension
        );
    }

    if types.contains(&ExtensionType::DefaultAccountState) {
        let config = state.get_extension::<DefaultAccountState>()?;
        require!(
            config.state == u8::from(AccountState::Initialized),
            MatchPoolsError::FrozenByDefault
        );
    }
    check_transfer_hook(&state, &types)
}

/// Cheap per-instruction check: the issuer can change these after the pool exists.
pub fn require_transferable(mint: &AccountInfo) -> Result<()> {
    let data = mint.try_borrow_data()?;
    let state = StateWithExtensions::<Mint>::unpack(&data)?;
    let types = state.get_extension_types()?;

    if types.contains(&ExtensionType::Pausable) {
        let config = state.get_extension::<PausableConfig>()?;
        require!(!bool::from(config.paused), MatchPoolsError::MintPaused);
    }
    check_transfer_hook(&state, &types)
}

fn check_transfer_hook(state: &StateWithExtensions<Mint>, types: &[ExtensionType]) -> Result<()> {
    if types.contains(&ExtensionType::TransferHook) {
        let hook = state.get_extension::<TransferHook>()?;
        require!(
            Option::<Pubkey>::from(hook.program_id).is_none(),
            MatchPoolsError::TransferHookEnabled
        );
    }
    Ok(())
}
