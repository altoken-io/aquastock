use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const POOL_SEED: &[u8] = b"pool";

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

#[constant]
pub const POSITION_SEED: &[u8] = b"position";

#[constant]
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Match ratio ceiling: 10_000 bps is a 1:1 match.
#[constant]
pub const MAX_MATCH_BPS: u16 = 10_000;

/// Floor is low on purpose so a demo pool can vest in minutes. Real pools use months.
#[constant]
pub const MIN_VESTING_SECONDS: i64 = 30;

#[constant]
pub const MAX_VESTING_SECONDS: i64 = 5 * 365 * 24 * 60 * 60;

/// Longest deposit window a pool may declare, counted from creation.
#[constant]
pub const MAX_POOL_WINDOW_SECONDS: i64 = 5 * 365 * 24 * 60 * 60;

/// Every supported mint (SPYx and the devnet replica) uses 8 decimals.
#[constant]
pub const MINT_DECIMALS: u8 = 8;
