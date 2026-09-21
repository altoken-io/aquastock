import type { PoolDto, PoolMetadataDto, PositionDto } from '@aquastock/types';

import type { ChainPool, ChainPosition } from './chain';
import { claimableForPosition, vestedForPosition } from './vesting';

export function toPoolDto(
  pool: ChainPool,
  metadata: PoolMetadataDto | null,
): PoolDto {
  return {
    address: pool.address.toBase58(),
    sponsor: pool.sponsor.toBase58(),
    mint: pool.mint.toBase58(),
    poolId: pool.poolId.toString(),
    matchBps: pool.matchBps,
    perSaverCap: pool.perSaverCap.toString(),
    vestingSeconds: pool.vestingSeconds,
    createdAt: pool.createdAt,
    endsAt: pool.endsAt,
    budgetTotal: pool.budgetTotal.toString(),
    reserved: pool.reserved.toString(),
    claimed: pool.claimed.toString(),
    depositsTotal: pool.depositsTotal.toString(),
    // The program keeps reserved <= budgetTotal; clamp anyway so a bad read shows zero.
    unreserved: (pool.budgetTotal > pool.reserved
      ? pool.budgetTotal - pool.reserved
      : 0n
    ).toString(),
    metadata,
  };
}

export function toPositionDto(
  position: ChainPosition,
  vestingSeconds: number,
  now: number,
): PositionDto {
  return {
    address: position.address.toBase58(),
    pool: position.pool.toBase58(),
    saver: position.saver.toBase58(),
    deposited: position.deposited.toString(),
    matchReserved: position.matchReserved.toString(),
    matchClaimed: position.matchClaimed.toString(),
    startedAt: position.startedAt,
    settled: position.settled,
    vested: vestedForPosition(position, vestingSeconds, now).toString(),
    claimable: claimableForPosition(position, vestingSeconds, now).toString(),
    asOf: now,
  };
}
