import { Program, type Provider } from '@anchor-lang/core';
import { matchPoolsIdl, type MatchPools } from '@aquastock/types/program';
import type { PublicKey } from '@solana/web3.js';

export type MatchPoolsProgram = Program<MatchPools>;

/**
 * The frozen IDL carries the test program id, so the deployed id is always supplied by
 * the caller (from `NEXT_PUBLIC_ANCHOR_PROGRAM_ID` in the app).
 */
export function createMatchPoolsProgram(
  provider: Provider,
  programId: PublicKey,
): MatchPoolsProgram {
  return new Program<MatchPools>(
    { ...matchPoolsIdl, address: programId.toBase58() },
    provider,
  );
}
