use anchor_lang::prelude::*;

use crate::error::MatchPoolsError;

/// Deployment-wide settings, written once by the program's upgrade authority. There is
/// no update instruction, so the allowed mint cannot change after `init_config`.
#[account]
#[derive(InitSpace, Debug, PartialEq, Eq)]
pub struct Config {
    /// The upgrade authority that initialised this deployment.
    pub admin: Pubkey,
    /// The only mint a pool may hold: SPYx on mainnet, the replica on devnet.
    pub allowed_mint: Pubkey,
    pub bump: u8,
}

/// One sponsor-funded match pool. All amounts are raw token units.
///
/// Vault accounting, which the tests assert:
/// `vault balance >= (budget_total - claimed) + deposits_total`.
/// Logic never reads the vault balance, so an unsolicited transfer into the
/// vault cannot skew it.
#[account]
#[derive(InitSpace, Debug, PartialEq, Eq)]
pub struct Pool {
    pub sponsor: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub pool_id: u64,
    pub match_bps: u16,
    /// Largest deposit a single saver may make.
    pub per_saver_cap: u64,
    pub vesting_seconds: i64,
    pub created_at: i64,
    /// Deposits and funding stop at this time; the sponsor may then reclaim unreserved budget.
    pub ends_at: i64,
    /// Match the sponsor has funded and not reclaimed.
    pub budget_total: u64,
    /// Match reserved for savers, claimed or not. Never exceeds `budget_total`.
    pub reserved: u64,
    /// Reserved match already paid out.
    pub claimed: u64,
    /// Saver principal currently held in the vault.
    pub deposits_total: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

impl Pool {
    /// Budget nobody has a claim on yet.
    pub fn unreserved(&self) -> Result<u64> {
        self.budget_total
            .checked_sub(self.reserved)
            .ok_or_else(|| error!(MatchPoolsError::MathOverflow))
    }
}

/// One saver's stake in one pool. A saver deposits once per pool.
#[account]
#[derive(InitSpace, Debug, PartialEq, Eq)]
pub struct Position {
    pub pool: Pubkey,
    pub saver: Pubkey,
    /// Principal still in the vault; zero once withdrawn.
    pub deposited: u64,
    /// Match reserved for this position, after any forfeiture.
    pub match_reserved: u64,
    pub match_claimed: u64,
    pub started_at: i64,
    /// Set by `withdraw`. The unvested match is forfeited at that moment, so
    /// what remains is fully vested and vesting must not be recomputed.
    pub settled: bool,
    pub bump: u8,
}
