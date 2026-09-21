use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{transfer_checked, Mint, TokenAccount, TransferChecked},
};

use crate::{error::MatchPoolsError, events::MatchFunded, state::Pool, token_guard};

#[derive(Accounts)]
pub struct FundMatch<'info> {
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

pub fn handle_fund_match(ctx: Context<FundMatch>, amount: u64) -> Result<()> {
    require!(amount > 0, MatchPoolsError::ZeroAmount);
    let now = Clock::get()?.unix_timestamp;
    token_guard::require_transferable(&ctx.accounts.mint.to_account_info())?;

    let pool = &mut ctx.accounts.pool;
    require!(now < pool.ends_at, MatchPoolsError::PoolEnded);
    pool.budget_total = pool
        .budget_total
        .checked_add(amount)
        .ok_or(MatchPoolsError::MathOverflow)?;
    let budget_total = pool.budget_total;
    let pool_key = pool.key();

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.sponsor_token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.sponsor.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.mint.decimals,
    )?;

    emit!(MatchFunded {
        pool: pool_key,
        sponsor: ctx.accounts.sponsor.key(),
        amount,
        budget_total,
    });
    Ok(())
}
