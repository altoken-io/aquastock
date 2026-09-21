use anchor_lang::prelude::*;

#[error_code]
pub enum MatchPoolsError {
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Only the pool sponsor can do this")]
    Unauthorized,
    #[msg("The mint does not match this pool")]
    WrongMint,
    #[msg("The vault does not match this pool")]
    WrongVault,
    #[msg("Match ratio must be between 1 and 10000 basis points")]
    InvalidMatchBps,
    #[msg("Per-saver cap must be greater than zero")]
    InvalidPerSaverCap,
    #[msg("Vesting period is outside the allowed range")]
    InvalidVestingDuration,
    #[msg("Deposit window must end in the future and within the allowed range")]
    InvalidPoolWindow,
    #[msg("Mint decimals are not supported")]
    InvalidMintDecimals,
    #[msg("Mint has an extension this program does not accept")]
    UnsupportedMintExtension,
    #[msg("Mint has an enabled transfer hook")]
    TransferHookEnabled,
    #[msg("Mint creates token accounts frozen by default")]
    FrozenByDefault,
    #[msg("Mint transfers are paused by the issuer")]
    MintPaused,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("The deposit window has closed")]
    PoolEnded,
    #[msg("The pool has not ended yet")]
    PoolNotEnded,
    #[msg("Deposit exceeds the per-saver cap")]
    DepositExceedsCap,
    #[msg("The match budget is exhausted")]
    BudgetExhausted,
    #[msg("Match available is below the minimum requested")]
    MatchBelowMinimum,
    #[msg("There is no vested match to claim")]
    NothingToClaim,
    #[msg("This position has already been withdrawn")]
    AlreadyWithdrawn,
    #[msg("This mint is not the one this deployment allows")]
    MintNotAllowed,
    #[msg("There is no unreserved budget to reclaim")]
    NothingToReclaim,
    #[msg("The position still has a deposit or unclaimed match")]
    PositionStillActive,
}
