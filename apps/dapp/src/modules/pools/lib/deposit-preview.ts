// What a deposit would do, decided before the wallet is ever asked. The checks follow the
// program's own order (`deposit.rs`), so a blocked reason here is the one the chain would give.
import type { PoolDto } from '@aquastock/types';

import {
  AmountError,
  uiToRaw,
  type AmountErrorCode,
} from '@/lib/solana/amounts';
import { previewDeposit } from '@/lib/pools/vesting';

export interface DepositContext {
  pool: Pick<PoolDto, 'endsAt' | 'perSaverCap' | 'matchBps' | 'unreserved'>;
  decimals: number;
  /** The mint's display multiplier, as a decimal string. */
  multiplier: string;
  /** The wallet's balance in raw units, or null while unknown. */
  balanceRaw: bigint | null;
  paused: boolean;
  transferHookEnabled: boolean;
  /** Unix seconds. */
  now: number;
}

export type BlockedReason =
  | 'ended'
  | 'paused'
  | 'transfer-hook'
  | 'over-cap'
  | 'budget-exhausted'
  | 'insufficient-balance';

export type DepositPreview =
  | { status: 'empty' }
  | { status: 'invalid'; reason: AmountErrorCode }
  | { status: 'blocked'; reason: BlockedReason; amountRaw: bigint | null }
  | {
      status: 'ok';
      amountRaw: bigint;
      /** Match this deposit reserves, after the budget limit. */
      matchedRaw: bigint;
      /** Match at the pool's ratio before the budget limit. */
      wantedRaw: bigint;
      /** True when the budget is smaller than the full match. */
      partial: boolean;
    };

export function previewDepositInput(
  input: string,
  context: DepositContext,
): DepositPreview {
  const { pool } = context;
  // Pool-wide blockers first: they apply whatever is typed, and the panel should say so.
  if (context.now >= pool.endsAt) {
    return { status: 'blocked', reason: 'ended', amountRaw: null };
  }
  if (context.paused) {
    return { status: 'blocked', reason: 'paused', amountRaw: null };
  }
  if (context.transferHookEnabled) {
    return { status: 'blocked', reason: 'transfer-hook', amountRaw: null };
  }
  if (input.trim() === '') return { status: 'empty' };

  let amountRaw: bigint;
  try {
    amountRaw = uiToRaw(input, context.decimals, context.multiplier, 'up');
  } catch (error) {
    if (error instanceof AmountError) {
      return { status: 'invalid', reason: error.code };
    }
    throw error;
  }

  if (amountRaw > BigInt(pool.perSaverCap)) {
    return { status: 'blocked', reason: 'over-cap', amountRaw };
  }
  const unreserved = BigInt(pool.unreserved);
  if (unreserved === 0n) {
    return { status: 'blocked', reason: 'budget-exhausted', amountRaw };
  }
  if (context.balanceRaw !== null && amountRaw > context.balanceRaw) {
    return { status: 'blocked', reason: 'insufficient-balance', amountRaw };
  }

  const { matched, partial } = previewDeposit(
    amountRaw,
    pool.matchBps,
    unreserved,
  );
  const wanted = (amountRaw * BigInt(pool.matchBps)) / 10_000n;
  return {
    status: 'ok',
    amountRaw,
    matchedRaw: matched,
    wantedRaw: wanted,
    partial,
  };
}
