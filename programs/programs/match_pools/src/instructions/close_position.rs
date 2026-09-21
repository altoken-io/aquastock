use anchor_lang::prelude::*;

use crate::{
    error::MatchPoolsError,
    events::PositionClosed,
    state::{Pool, Position},
};

#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(mut)]
    pub saver: Signer<'info>,
    pub pool: Account<'info, Pool>,
    /// Closable only once the deposit is withdrawn and every reserved match token is
    /// claimed, so closing can never strand funds. Rent returns to the saver.
    #[account(
        mut,
        close = saver,
        has_one = pool,
        has_one = saver @ MatchPoolsError::Unauthorized,
        constraint = position.settled && position.match_claimed == position.match_reserved
            @ MatchPoolsError::PositionStillActive
    )]
    pub position: Account<'info, Position>,
}

pub fn handle_close_position(ctx: Context<ClosePosition>) -> Result<()> {
    emit!(PositionClosed {
        pool: ctx.accounts.pool.key(),
        saver: ctx.accounts.saver.key(),
    });
    Ok(())
}
