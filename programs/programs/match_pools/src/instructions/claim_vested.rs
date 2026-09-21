use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{transfer_checked, Mint, TokenAccount, TransferChecked},
};

use crate::{
    constants::POOL_SEED,
    error::MatchPoolsError,
    events::Claimed,
    state::{Pool, Position},
    token_guard, vesting,
};

#[derive(Accounts)]
pub struct ClaimVested<'info> {
    pub saver: Signer<'info>,
    #[account(
        mut,
        has_one = mint @ MatchPoolsError::WrongMint,
        has_one = vault @ MatchPoolsError::WrongVault
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        mut,
        has_one = pool,
        has_one = saver @ MatchPoolsError::Unauthorized
    )]
    pub position: Account<'info, Position>,
    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = pool, token::token_program = token_program)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = saver,
        token::token_program = token_program
    )]
    pub saver_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
}

pub fn handle_claim_vested(ctx: Context<ClaimVested>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    token_guard::require_transferable(&ctx.accounts.mint.to_account_info())?;

    let pool = &mut ctx.accounts.pool;
    let position = &mut ctx.accounts.position;

    // After a withdrawal the unvested part is gone, so the remainder is fully vested.
    let vested = if position.settled {
        position.match_reserved
    } else {
        vesting::vested_amount(
            position.match_reserved,
            position.started_at,
            pool.vesting_seconds,
            now,
        )?
    };
    let claimable = vested
        .checked_sub(position.match_claimed)
        .ok_or(MatchPoolsError::MathOverflow)?;
    require!(claimable > 0, MatchPoolsError::NothingToClaim);

    position.match_claimed = position
        .match_claimed
        .checked_add(claimable)
        .ok_or(MatchPoolsError::MathOverflow)?;
    pool.claimed = pool
        .claimed
        .checked_add(claimable)
        .ok_or(MatchPoolsError::MathOverflow)?;
    let total_claimed = position.match_claimed;

    let sponsor = pool.sponsor;
    let pool_id = pool.pool_id.to_le_bytes();
    let bump = [pool.bump];
    let signer_seeds: &[&[&[u8]]] = &[&[POOL_SEED, sponsor.as_ref(), &pool_id, &bump]];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.saver_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        claimable,
        ctx.accounts.mint.decimals,
    )?;

    emit!(Claimed {
        pool: ctx.accounts.pool.key(),
        saver: ctx.accounts.saver.key(),
        amount: claimable,
        total_claimed,
    });
    Ok(())
}
