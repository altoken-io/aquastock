use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{transfer_checked, Mint, TokenAccount, TransferChecked},
};

use crate::{
    constants::POOL_SEED, error::MatchPoolsError, events::UnmatchedReclaimed, state::Pool,
    token_guard,
};

#[derive(Accounts)]
pub struct ReclaimUnmatched<'info> {
    pub sponsor: Signer<'info>,
    #[account(
        mut,
        has_one = sponsor @ MatchPoolsError::Unauthorized,
        has_one = mint @ MatchPoolsError::WrongMint,
        has_one = vault @ MatchPoolsError::WrongVault
    )]
    pub pool: Account<'info, Pool>,
    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = pool, token::token_program = token_program)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = sponsor,
        token::token_program = token_program
    )]
    pub sponsor_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
}

/// After the pool ends the sponsor takes back budget nobody has a claim on. Match
/// reserved for savers stays put, and match forfeited by a later withdrawal becomes
/// reclaimable the moment it is forfeited.
pub fn handle_reclaim_unmatched(ctx: Context<ReclaimUnmatched>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    token_guard::require_transferable(&ctx.accounts.mint.to_account_info())?;

    let pool = &mut ctx.accounts.pool;
    require!(now >= pool.ends_at, MatchPoolsError::PoolNotEnded);
    let amount = pool.unreserved()?;
    require!(amount > 0, MatchPoolsError::NothingToReclaim);

    pool.budget_total = pool
        .budget_total
        .checked_sub(amount)
        .ok_or(MatchPoolsError::MathOverflow)?;
    let budget_total = pool.budget_total;
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
                to: ctx.accounts.sponsor_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
        ctx.accounts.mint.decimals,
    )?;

    emit!(UnmatchedReclaimed {
        pool: ctx.accounts.pool.key(),
        sponsor,
        amount,
        budget_total,
    });
    Ok(())
}
