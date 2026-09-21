use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{transfer_checked, Mint, TokenAccount, TransferChecked},
};

use crate::{
    constants::*,
    error::MatchPoolsError,
    events::Deposited,
    state::{Pool, Position},
    token_guard, vesting,
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub saver: Signer<'info>,
    #[account(
        mut,
        has_one = mint @ MatchPoolsError::WrongMint,
        has_one = vault @ MatchPoolsError::WrongVault
    )]
    pub pool: Account<'info, Pool>,
    /// One position per saver per pool, so a second deposit fails at `init`.
    #[account(
        init,
        payer = saver,
        space = 8 + Position::INIT_SPACE,
        seeds = [POSITION_SEED, pool.key().as_ref(), saver.key().as_ref()],
        bump
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
    pub system_program: Program<'info, System>,
}

/// `min_match` protects the saver from a race: the match is first come first served,
/// so if the budget shrinks between preview and execution the deposit reverts
/// instead of silently earning less.
pub fn handle_deposit(ctx: Context<Deposit>, amount: u64, min_match: u64) -> Result<()> {
    require!(amount > 0, MatchPoolsError::ZeroAmount);
    let now = Clock::get()?.unix_timestamp;
    token_guard::require_transferable(&ctx.accounts.mint.to_account_info())?;

    let pool = &mut ctx.accounts.pool;
    require!(now < pool.ends_at, MatchPoolsError::PoolEnded);
    require!(
        amount <= pool.per_saver_cap,
        MatchPoolsError::DepositExceedsCap
    );

    let unreserved = pool.unreserved()?;
    require!(unreserved > 0, MatchPoolsError::BudgetExhausted);
    let matched = vesting::match_for_deposit(amount, pool.match_bps)?.min(unreserved);
    require!(matched >= min_match, MatchPoolsError::MatchBelowMinimum);

    // Effects before the token CPI.
    pool.reserved = pool
        .reserved
        .checked_add(matched)
        .ok_or(MatchPoolsError::MathOverflow)?;
    pool.deposits_total = pool
        .deposits_total
        .checked_add(amount)
        .ok_or(MatchPoolsError::MathOverflow)?;
    let pool_key = pool.key();

    let position = &mut ctx.accounts.position;
    position.pool = pool_key;
    position.saver = ctx.accounts.saver.key();
    position.deposited = amount;
    position.match_reserved = matched;
    position.match_claimed = 0;
    position.started_at = now;
    position.settled = false;
    position.bump = ctx.bumps.position;

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.saver_token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.saver.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.mint.decimals,
    )?;

    emit!(Deposited {
        pool: pool_key,
        saver: ctx.accounts.saver.key(),
        amount,
        match_reserved: matched,
        started_at: now,
    });
    Ok(())
}
