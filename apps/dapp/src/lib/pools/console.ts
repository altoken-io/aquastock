// What the operator console shows: totals across every pool, the deployment's facts, and the
// latest activity across pools. Read-only, and each part fails on its own so one bad read never
// blanks the console.
import type {
  DeploymentDto,
  PoolActivityDto,
  PoolActivityPageDto,
  PoolDto,
} from '@aquastock/types';

import {
  getDeployment,
  listActivity,
  listPools,
  type PoolServiceDeps,
} from './service';

export interface ConsoleTotals {
  poolCount: number;
  /** Pools still taking deposits at `now`. */
  openCount: number;
  budget: bigint;
  reserved: bigint;
  deposits: bigint;
  claimed: bigint;
}

export function summarizePools(
  pools: readonly PoolDto[],
  now: number,
): ConsoleTotals {
  return pools.reduce<ConsoleTotals>(
    (sum, pool) => ({
      poolCount: sum.poolCount + 1,
      openCount: sum.openCount + (pool.endsAt > now ? 1 : 0),
      budget: sum.budget + BigInt(pool.budgetTotal),
      reserved: sum.reserved + BigInt(pool.reserved),
      deposits: sum.deposits + BigInt(pool.depositsTotal),
      claimed: sum.claimed + BigInt(pool.claimed),
    }),
    {
      poolCount: 0,
      openCount: 0,
      budget: 0n,
      reserved: 0n,
      deposits: 0n,
      claimed: 0n,
    },
  );
}

export interface ConsoleActivity extends PoolActivityDto {
  pool: Pick<PoolDto, 'address' | 'poolId' | 'metadata'>;
}

/**
 * The latest activity across pools. Looks only at the most recently created pools (activity
 * is per pool and a console does not need the whole history), then merges newest first.
 */
export async function recentActivity(
  load: (address: string) => Promise<PoolActivityPageDto>,
  pools: readonly PoolDto[],
  { poolLimit, limit }: { poolLimit: number; limit: number },
): Promise<ConsoleActivity[]> {
  const newest = [...pools]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, poolLimit);
  const pages = await Promise.all(
    newest.map(async (pool) => {
      try {
        const page = await load(pool.address);
        return page.items.map((item): ConsoleActivity => ({
          ...item,
          pool: {
            address: pool.address,
            poolId: pool.poolId,
            metadata: pool.metadata,
          },
        }));
      } catch {
        return [];
      }
    }),
  );
  return pages
    .flat()
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
}

export interface ConsoleSnapshot {
  deployment: DeploymentDto | null;
  /** Null when the chain could not be read, which is different from "no pools". */
  pools: PoolDto[] | null;
  activity: ConsoleActivity[];
}

export async function loadConsole(
  deps: PoolServiceDeps,
): Promise<ConsoleSnapshot> {
  const [deployment, list] = await Promise.all([
    getDeployment(deps).catch(() => null),
    listPools(deps, { status: 'all', limit: 100 }).catch(() => null),
  ]);
  const pools = list?.pools ?? null;
  const activity = pools
    ? await recentActivity(
        (address) => listActivity(deps, address, { limit: 6 }),
        pools,
        { poolLimit: 6, limit: 8 },
      )
    : [];
  return { deployment, pools, activity };
}
