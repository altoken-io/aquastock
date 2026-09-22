//! AquaStock Match Pools: a sponsor funds a match budget, savers deposit a
//! Token-2022 index stock, and the match vests linearly. Withdrawing early forfeits
//! the unvested match back to the sponsor's unreserved budget.
//!
//! Deposit and match are the same mint in raw units, so the ratio needs no price oracle.

pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;
pub mod token_guard;
pub mod vesting;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("8wnjTUiMQaPxdgfgZdJUGAWBgdPqKoVUAtcWgpgs3GXR");

#[program]
pub mod match_pools {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>) -> Result<()> {
        instructions::init_config::handle_init_config(ctx)
    }

    pub fn create_pool(ctx: Context<CreatePool>, params: CreatePoolParams) -> Result<()> {
        instructions::create_pool::handle_create_pool(ctx, params)
    }

    pub fn fund_match(ctx: Context<FundMatch>, amount: u64) -> Result<()> {
        instructions::fund_match::handle_fund_match(ctx, amount)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, min_match: u64) -> Result<()> {
        instructions::deposit::handle_deposit(ctx, amount, min_match)
    }

    pub fn claim_vested(ctx: Context<ClaimVested>) -> Result<()> {
        instructions::claim_vested::handle_claim_vested(ctx)
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        instructions::withdraw::handle_withdraw(ctx)
    }

    pub fn reclaim_unmatched(ctx: Context<ReclaimUnmatched>) -> Result<()> {
        instructions::reclaim_unmatched::handle_reclaim_unmatched(ctx)
    }

    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        instructions::close_position::handle_close_position(ctx)
    }
}
