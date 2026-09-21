import type { PoolDto, PositionDto } from '@aquastock/types';

import {
  claimableForPosition,
  vestedForPosition,
  type PositionState,
} from '@/lib/pools/vesting';

export type PositionStatus = 'vesting' | 'vested' | 'withdrawn' | 'done';

export interface PositionView {
  state: PositionState;
  /** Vested match at `now`, from the program's own schedule. Claimed comes from the chain only. */
  vested: bigint;
  claimable: bigint;
  allClaimed: boolean;
  status: PositionStatus;
  /** 0..1 of the reserved match that has vested; 1 when nothing was reserved. */
  fraction: number;
  /** Withdrawn and fully claimed: only closing the account is left. */
  canClose: boolean;
}

const ratio = (part: bigint, whole: bigint): number =>
  whole > 0n ? Number((part * 10_000n) / whole) / 10_000 : 1;

/** Everything a screen needs to say about one position at one moment. */
export function viewPosition(
  position: PositionDto,
  pool: Pick<PoolDto, 'vestingSeconds'>,
  now: number,
): PositionView {
  const state: PositionState = {
    deposited: BigInt(position.deposited),
    matchReserved: BigInt(position.matchReserved),
    matchClaimed: BigInt(position.matchClaimed),
    startedAt: position.startedAt,
    settled: position.settled,
  };
  const vested = vestedForPosition(state, pool.vestingSeconds, now);
  const claimable = claimableForPosition(state, pool.vestingSeconds, now);
  const allClaimed = state.matchClaimed >= state.matchReserved;
  const status: PositionStatus = state.settled
    ? allClaimed
      ? 'done'
      : 'withdrawn'
    : vested >= state.matchReserved
      ? 'vested'
      : 'vesting';
  return {
    state,
    vested,
    claimable,
    allClaimed,
    status,
    fraction: ratio(vested, state.matchReserved),
    canClose: state.settled && allClaimed,
  };
}

export interface PositionTotals {
  deposited: bigint;
  matchReserved: bigint;
  claimed: bigint;
  claimable: bigint;
}

/** Sums across pools. Safe because a deployment has exactly one allowed mint. */
export function totalPositions(views: readonly PositionView[]): PositionTotals {
  return views.reduce<PositionTotals>(
    (sum, view) => ({
      deposited: sum.deposited + view.state.deposited,
      matchReserved: sum.matchReserved + view.state.matchReserved,
      claimed: sum.claimed + view.state.matchClaimed,
      claimable: sum.claimable + view.claimable,
    }),
    { deposited: 0n, matchReserved: 0n, claimed: 0n, claimable: 0n },
  );
}
