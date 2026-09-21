// Instruction builders for every Match Pools action. They only assemble instructions; signing,
// sending and confirming live in `send.ts`. Accounts are always passed explicitly, so a wrong
// pool or mint fails here, not silently on chain.
import { BN } from '@anchor-lang/core';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import {
  SystemProgram,
  type PublicKey,
  type TransactionInstruction,
} from '@solana/web3.js';

import { configPda, poolPda, positionPda, vaultPda } from '@/lib/solana/pdas';
import type { MatchPoolsProgram } from '@/lib/solana/program';

const bn = (value: bigint): BN => new BN(value.toString());

/** The wallet's Token-2022 associated token account for the pool token. */
export function tokenAccountOf(mint: PublicKey, owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    mint,
    owner,
    true,
    TOKEN_2022_PROGRAM_ID,
  );
}

/**
 * Creates the wallet's token account if it does not exist yet, and does nothing if it does.
 * Claims, withdrawals and reclaims pay out to it, so it must exist even if the person closed
 * it after depositing everything.
 */
function ensureTokenAccount(
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
): TransactionInstruction {
  return createAssociatedTokenAccountIdempotentInstruction(
    payer,
    tokenAccountOf(mint, owner),
    owner,
    mint,
    TOKEN_2022_PROGRAM_ID,
  );
}

interface PoolContext {
  program: MatchPoolsProgram;
  pool: PublicKey;
  mint: PublicKey;
}

export async function buildDeposit(
  context: PoolContext & {
    saver: PublicKey;
    amountRaw: bigint;
    /** The least match the saver accepts: the program reverts rather than match them less. */
    minMatchRaw: bigint;
  },
): Promise<TransactionInstruction[]> {
  const { program, pool, mint, saver } = context;
  return [
    await program.methods
      .deposit(bn(context.amountRaw), bn(context.minMatchRaw))
      .accountsPartial({
        saver,
        pool,
        position: positionPda(program.programId, pool, saver),
        mint,
        vault: vaultPda(program.programId, pool),
        saverTokenAccount: tokenAccountOf(mint, saver),
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction(),
  ];
}

async function buildPayout(
  context: PoolContext & { saver: PublicKey },
  kind: 'claim' | 'withdraw',
): Promise<TransactionInstruction[]> {
  const { program, pool, mint, saver } = context;
  const method =
    kind === 'claim'
      ? program.methods.claimVested()
      : program.methods.withdraw();
  return [
    ensureTokenAccount(saver, mint, saver),
    await method
      .accountsPartial({
        saver,
        pool,
        position: positionPda(program.programId, pool, saver),
        mint,
        vault: vaultPda(program.programId, pool),
        saverTokenAccount: tokenAccountOf(mint, saver),
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction(),
  ];
}

export const buildClaim = (context: PoolContext & { saver: PublicKey }) =>
  buildPayout(context, 'claim');

export const buildWithdraw = (context: PoolContext & { saver: PublicKey }) =>
  buildPayout(context, 'withdraw');

export async function buildClosePosition(
  context: Pick<PoolContext, 'program' | 'pool'> & { saver: PublicKey },
): Promise<TransactionInstruction[]> {
  const { program, pool, saver } = context;
  return [
    await program.methods
      .closePosition()
      .accountsPartial({
        saver,
        pool,
        position: positionPda(program.programId, pool, saver),
      })
      .instruction(),
  ];
}

export async function buildFundMatch(
  context: PoolContext & { sponsor: PublicKey; amountRaw: bigint },
): Promise<TransactionInstruction[]> {
  const { program, pool, mint, sponsor } = context;
  return [
    await program.methods
      .fundMatch(bn(context.amountRaw))
      .accountsPartial({
        sponsor,
        pool,
        mint,
        vault: vaultPda(program.programId, pool),
        sponsorTokenAccount: tokenAccountOf(mint, sponsor),
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction(),
  ];
}

export async function buildReclaim(
  context: PoolContext & { sponsor: PublicKey },
): Promise<TransactionInstruction[]> {
  const { program, pool, mint, sponsor } = context;
  return [
    ensureTokenAccount(sponsor, mint, sponsor),
    await program.methods
      .reclaimUnmatched()
      .accountsPartial({
        sponsor,
        pool,
        mint,
        vault: vaultPda(program.programId, pool),
        sponsorTokenAccount: tokenAccountOf(mint, sponsor),
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction(),
  ];
}

export interface CreatePoolInput {
  poolId: bigint;
  matchBps: number;
  perSaverCap: bigint;
  vestingSeconds: number;
  endsAt: number;
  /** The first match budget. Creating and funding land together, so a pool is never empty. */
  budgetRaw: bigint;
}

/** Creates the pool and funds its match in one transaction: all of it lands, or none. */
export async function buildCreatePool(
  context: Pick<PoolContext, 'program' | 'mint'> & {
    sponsor: PublicKey;
    input: CreatePoolInput;
  },
): Promise<{ pool: PublicKey; instructions: TransactionInstruction[] }> {
  const { program, mint, sponsor, input } = context;
  const pool = poolPda(program.programId, sponsor, input.poolId);
  const vault = vaultPda(program.programId, pool);
  const create = await program.methods
    .createPool({
      poolId: bn(input.poolId),
      matchBps: input.matchBps,
      perSaverCap: bn(input.perSaverCap),
      vestingSeconds: new BN(input.vestingSeconds),
      endsAt: new BN(input.endsAt),
    })
    .accountsPartial({
      sponsor,
      mint,
      config: configPda(program.programId),
      pool,
      vault,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  const fund = await buildFundMatch({
    program,
    pool,
    mint,
    sponsor,
    amountRaw: input.budgetRaw,
  });
  return { pool, instructions: [create, ...fund] };
}

/** A random pool id below 2^52, unique enough per sponsor, and safe as a JS number too. */
export function randomPoolId(): bigint {
  const [high = 0, low = 0] = crypto.getRandomValues(new Uint32Array(2));
  return (BigInt(high & 0xf_ffff) << 32n) | BigInt(low);
}
