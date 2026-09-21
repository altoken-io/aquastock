use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};

use crate::{
    constants::*,
    error::MatchPoolsError,
    events::PoolCreated,
    state::{Config, Pool},
    token_guard,
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct CreatePoolParams {
    /// Lets one sponsor run several pools.
    pub pool_id: u64,
    /// Match per deposit in basis points; 10_000 is 1:1.
    pub match_bps: u16,
    /// Largest deposit one saver may make, in raw units.
    pub per_saver_cap: u64,
    pub vesting_seconds: i64,
    /// Unix time when deposits and funding stop.
    pub ends_at: i64,
}

#[derive(Accounts)]
#[instruction(params: CreatePoolParams)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub sponsor: Signer<'info>,
    /// Must be a Token-2022 mint; the extension set is checked in the handler.
    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = config.allowed_mint == mint.key() @ MatchPoolsError::MintNotAllowed
    )]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = sponsor,
        space = 8 + Pool::INIT_SPACE,
        seeds = [POOL_SEED, sponsor.key().as_ref(), &params.pool_id.to_le_bytes()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    /// Sized by Anchor from the mint's required account extensions.
    #[account(
        init,
        payer = sponsor,
        token::mint = mint,
        token::authority = pool,
        token::token_program = token_program,
        seeds = [VAULT_SEED, pool.key().as_ref()],
        bump
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_pool(ctx: Context<CreatePool>, params: CreatePoolParams) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;

    require!(
        params.match_bps > 0 && params.match_bps <= MAX_MATCH_BPS,
        MatchPoolsError::InvalidMatchBps
    );
    require!(
        params.per_saver_cap > 0,
        MatchPoolsError::InvalidPerSaverCap
    );
    require!(
        (MIN_VESTING_SECONDS..=MAX_VESTING_SECONDS).contains(&params.vesting_seconds),
        MatchPoolsError::InvalidVestingDuration
    );
    let window = params
        .ends_at
        .checked_sub(now)
        .ok_or(MatchPoolsError::MathOverflow)?;
    require!(
        window > 0 && window <= MAX_POOL_WINDOW_SECONDS,
        MatchPoolsError::InvalidPoolWindow
    );

    token_guard::validate_pool_mint(&ctx.accounts.mint.to_account_info())?;

    let pool = &mut ctx.accounts.pool;
    pool.sponsor = ctx.accounts.sponsor.key();
    pool.mint = ctx.accounts.mint.key();
    pool.vault = ctx.accounts.vault.key();
    pool.pool_id = params.pool_id;
    pool.match_bps = params.match_bps;
    pool.per_saver_cap = params.per_saver_cap;
    pool.vesting_seconds = params.vesting_seconds;
    pool.created_at = now;
    pool.ends_at = params.ends_at;
    pool.budget_total = 0;
    pool.reserved = 0;
    pool.claimed = 0;
    pool.deposits_total = 0;
    pool.bump = ctx.bumps.pool;
    pool.vault_bump = ctx.bumps.vault;

    emit!(PoolCreated {
        pool: pool.key(),
        sponsor: pool.sponsor,
        mint: pool.mint,
        pool_id: pool.pool_id,
        match_bps: pool.match_bps,
        per_saver_cap: pool.per_saver_cap,
        vesting_seconds: pool.vesting_seconds,
        ends_at: pool.ends_at,
    });
    Ok(())
}
