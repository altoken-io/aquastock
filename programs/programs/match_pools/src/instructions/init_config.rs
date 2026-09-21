use anchor_lang::prelude::*;
use anchor_spl::{token_2022::Token2022, token_interface::Mint};

use crate::{
    constants::CONFIG_SEED, error::MatchPoolsError, events::ConfigInitialized, state::Config,
    token_guard,
};

#[derive(Accounts)]
pub struct InitConfig<'info> {
    /// Must be the program's upgrade authority. Whoever can replace the code can
    /// already do anything, so this adds no new trust; it stops a stranger from
    /// front-running the deploy and choosing the mint.
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(constraint = program.programdata_address()? == Some(program_data.key()) @ MatchPoolsError::Unauthorized)]
    pub program: Program<'info, crate::program::MatchPools>,
    #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()) @ MatchPoolsError::Unauthorized)]
    pub program_data: Account<'info, ProgramData>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handle_init_config(ctx: Context<InitConfig>) -> Result<()> {
    // Refuse to allow-list a mint the pools could not safely hold anyway.
    token_guard::validate_pool_mint(&ctx.accounts.mint.to_account_info())?;

    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.authority.key();
    config.allowed_mint = ctx.accounts.mint.key();
    config.bump = ctx.bumps.config;

    emit!(ConfigInitialized {
        admin: config.admin,
        allowed_mint: config.allowed_mint,
    });
    Ok(())
}
