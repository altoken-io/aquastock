import type { PoolDto } from '@aquastock/types';

export type PoolPhase = 'open' | 'ending-soon' | 'budget-full' | 'ended';

const ENDING_SOON_SECONDS = 24 * 3_600;

/**
 * Where a pool stands right now. The order matters: an ended pool is ended no matter what
 * budget is left, and a pool with no unreserved match is "full" even if it is also nearly over.
 */
export function poolPhase(
  pool: Pick<PoolDto, 'endsAt' | 'unreserved'>,
  now: number,
): PoolPhase {
  if (now >= pool.endsAt) return 'ended';
  if (BigInt(pool.unreserved) === 0n) return 'budget-full';
  if (pool.endsAt - now < ENDING_SOON_SECONDS) return 'ending-soon';
  return 'open';
}

/** Share of the match budget already reserved, 0..1, for the ring. A chart value, not money. */
export function reservedFraction(
  pool: Pick<PoolDto, 'budgetTotal' | 'reserved'>,
): number {
  const total = BigInt(pool.budgetTotal);
  if (total === 0n) return 0;
  const basisPoints = (BigInt(pool.reserved) * 10_000n) / total;
  return Math.min(1, Number(basisPoints) / 10_000);
}

/** Seconds left to deposit, never negative. */
export function secondsLeft(
  pool: Pick<PoolDto, 'endsAt'>,
  now: number,
): number {
  return Math.max(0, pool.endsAt - now);
}
