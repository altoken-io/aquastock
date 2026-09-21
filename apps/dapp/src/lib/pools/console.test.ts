import type { PoolActivityDto, PoolDto } from '@aquastock/types';
import { describe, expect, it } from 'vitest';

import { recentActivity, summarizePools } from './console';

const NOW = 1_800_000_000;

function pool(over: Partial<PoolDto> = {}): PoolDto {
  return {
    address: 'a',
    sponsor: 's',
    mint: 'm',
    poolId: '1',
    matchBps: 10_000,
    perSaverCap: '100',
    vestingSeconds: 100,
    createdAt: NOW - 1_000,
    endsAt: NOW + 1_000,
    budgetTotal: '1000',
    reserved: '400',
    claimed: '50',
    depositsTotal: '400',
    unreserved: '600',
    metadata: null,
    ...over,
  };
}

function item(id: string, occurredAt: string): PoolActivityDto {
  return {
    id,
    kind: 'DEPOSITED',
    wallet: 'w',
    amount: '1',
    matchAmount: '1',
    txSignature: `sig-${id}`,
    occurredAt,
  };
}

describe('summarizePools', () => {
  it('sums in exact integers and counts only pools still open', () => {
    const totals = summarizePools(
      [
        pool({ budgetTotal: '18446744073709551615', reserved: '1' }),
        pool({ endsAt: NOW - 1 }),
        pool({ endsAt: NOW }),
      ],
      NOW,
    );
    expect(totals.poolCount).toBe(3);
    // Closing at exactly `now` is closed, like the program.
    expect(totals.openCount).toBe(1);
    expect(totals.budget).toBe(18446744073709551615n + 2_000n);
    expect(totals.reserved).toBe(1n + 800n);
    expect(totals.claimed).toBe(150n);
  });

  it('is all zeros for no pools', () => {
    expect(summarizePools([], NOW)).toEqual({
      poolCount: 0,
      openCount: 0,
      budget: 0n,
      reserved: 0n,
      deposits: 0n,
      claimed: 0n,
    });
  });
});

describe('recentActivity', () => {
  const pools = [
    pool({ address: 'old', createdAt: 1 }),
    pool({ address: 'new', createdAt: 3 }),
    pool({ address: 'mid', createdAt: 2 }),
  ];
  const feed: Record<string, PoolActivityDto[]> = {
    old: [item('o1', '2026-01-01T00:00:00.000Z')],
    new: [
      item('n1', '2026-03-01T00:00:00.000Z'),
      item('n2', '2026-02-01T00:00:00.000Z'),
    ],
    mid: [item('m1', '2026-02-15T00:00:00.000Z')],
  };
  const load = async (address: string) => ({
    items: feed[address] ?? [],
    nextCursor: null,
  });

  it('merges pools newest first and labels each item with its pool', async () => {
    const result = await recentActivity(load, pools, {
      poolLimit: 3,
      limit: 10,
    });
    expect(result.map((r) => r.id)).toEqual(['n1', 'm1', 'n2', 'o1']);
    expect(result[1]?.pool.address).toBe('mid');
  });

  it('only looks at the newest pools and caps the total', async () => {
    const result = await recentActivity(load, pools, {
      poolLimit: 2,
      limit: 2,
    });
    expect(result.map((r) => r.id)).toEqual(['n1', 'm1']);
  });

  it('skips a pool whose feed cannot be read instead of failing the whole console', async () => {
    const result = await recentActivity(
      async (address) => {
        if (address === 'new') throw new Error('db down');
        return load(address);
      },
      pools,
      { poolLimit: 3, limit: 10 },
    );
    expect(result.map((r) => r.id)).toEqual(['m1', 'o1']);
  });
});
