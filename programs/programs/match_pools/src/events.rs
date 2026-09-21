use anchor_lang::prelude::*;

#[event]
pub struct PoolCreated {
    pub pool: Pubkey,
    pub sponsor: Pubkey,
    pub mint: Pubkey,
    pub pool_id: u64,
    pub match_bps: u16,
    pub per_saver_cap: u64,
    pub vesting_seconds: i64,
    pub ends_at: i64,
}

#[event]
pub struct MatchFunded {
    pub pool: Pubkey,
    pub sponsor: Pubkey,
    pub amount: u64,
    pub budget_total: u64,
}

#[event]
pub struct Deposited {
    pub pool: Pubkey,
    pub saver: Pubkey,
    pub amount: u64,
    pub match_reserved: u64,
    pub started_at: i64,
}

#[event]
pub struct Claimed {
    pub pool: Pubkey,
    pub saver: Pubkey,
    pub amount: u64,
    pub total_claimed: u64,
}

#[event]
pub struct Withdrawn {
    pub pool: Pubkey,
    pub saver: Pubkey,
    pub principal: u64,
    pub forfeited: u64,
}

#[event]
pub struct ConfigInitialized {
    pub admin: Pubkey,
    pub allowed_mint: Pubkey,
}

#[event]
pub struct UnmatchedReclaimed {
    pub pool: Pubkey,
    pub sponsor: Pubkey,
    pub amount: u64,
    pub budget_total: u64,
}

#[event]
pub struct PositionClosed {
    pub pool: Pubkey,
    pub saver: Pubkey,
}
