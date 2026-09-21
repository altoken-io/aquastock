'use client';

import {
  useInfiniteQuery,
  useQuery,
  type QueryClient,
} from '@tanstack/react-query';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import type {
  DeploymentDto,
  MyPositionDto,
  PoolActivityPageDto,
  PoolDto,
  PoolActivityPageDto as ActivityPage,
  PositionDto,
} from '@aquastock/types';

import { activityUrl, fetchJson } from '../lib/api-client';

export type PoolStatusFilter = 'open' | 'ended' | 'all';

export interface PoolListData {
  pools: PoolDto[];
  total: number;
}

export interface PoolDetailData {
  pool: PoolDto;
  activity: ActivityPage;
  position: PositionDto | null;
}

export const queryKeys = {
  deployment: ['deployment'] as const,
  pools: (status: PoolStatusFilter) => ['pools', status] as const,
  pool: (address: string, wallet: string | null) =>
    ['pool', address, wallet] as const,
  activity: (address: string) => ['activity', address] as const,
  positions: (wallet: string) => ['positions', wallet] as const,
  balance: (mint: string, owner: string) => ['balance', mint, owner] as const,
};

/** Refetch cadence: fast enough that chain changes show up while someone is watching. */
const LIVE_MS = 6_000;

export function useDeployment(initialData?: DeploymentDto) {
  return useQuery({
    queryKey: queryKeys.deployment,
    queryFn: () => fetchJson<DeploymentDto>('/api/deployment'),
    initialData,
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}

/** The pools a wallet sponsors. Shares the `['pools']` prefix, so a transaction refreshes it. */
export function useSponsoredPools(wallet: string | null) {
  return useQuery({
    queryKey: ['pools', 'sponsored', wallet ?? ''] as const,
    queryFn: () =>
      fetchJson<PoolListData>(
        `/api/pools?sponsor=${wallet}&status=all&limit=50`,
      ),
    enabled: wallet !== null,
    staleTime: 4_000,
    refetchInterval: LIVE_MS * 2,
  });
}

export function usePools(status: PoolStatusFilter, initialData?: PoolListData) {
  return useQuery({
    queryKey: queryKeys.pools(status),
    queryFn: () => fetchJson<PoolListData>(`/api/pools?status=${status}`),
    initialData,
    staleTime: 4_000,
    refetchInterval: LIVE_MS * 2,
  });
}

export function usePoolDetail(
  address: string,
  wallet: string | null,
  initialData?: PoolDetailData,
) {
  return useQuery({
    queryKey: queryKeys.pool(address, wallet),
    queryFn: () =>
      fetchJson<PoolDetailData>(
        `/api/pools/${address}${wallet ? `?wallet=${wallet}` : ''}`,
      ),
    // Server data is the wallet-less view; do not treat it as the wallet's own.
    initialData: wallet ? undefined : initialData,
    staleTime: 2_000,
    refetchInterval: LIVE_MS,
  });
}

export function useActivity(address: string, first: PoolActivityPageDto) {
  return useInfiniteQuery({
    queryKey: queryKeys.activity(address),
    queryFn: ({ pageParam }) =>
      fetchJson<PoolActivityPageDto>(activityUrl(address, pageParam)),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    initialData: { pages: [first], pageParams: [null] },
    staleTime: 4_000,
    refetchInterval: LIVE_MS * 2,
  });
}

export function usePositions(wallet: string | null) {
  return useQuery({
    queryKey: queryKeys.positions(wallet ?? ''),
    queryFn: () =>
      fetchJson<{ positions: MyPositionDto[] }>(
        `/api/positions?wallet=${wallet}`,
      ),
    enabled: wallet !== null,
    staleTime: 2_000,
    refetchInterval: LIVE_MS,
  });
}

/** The wallet's balance of the pool token in raw units; null when it holds none. */
export function useTokenBalance(mint: string | null, owner: string | null) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: queryKeys.balance(mint ?? '', owner ?? ''),
    enabled: mint !== null && owner !== null,
    staleTime: 3_000,
    refetchInterval: LIVE_MS,
    queryFn: async (): Promise<bigint | null> => {
      if (!mint || !owner) return null;
      const ata = getAssociatedTokenAddressSync(
        new PublicKey(mint),
        new PublicKey(owner),
        true,
        TOKEN_2022_PROGRAM_ID,
      );
      try {
        const balance = await connection.getTokenAccountBalance(
          ata,
          'confirmed',
        );
        return BigInt(balance.value.amount);
      } catch {
        // No token account yet means a zero balance, not an error.
        return null;
      }
    },
  });
}

/** After a transaction lands, refresh everything that could have changed. */
export function invalidatePoolData(
  client: QueryClient,
  address?: string,
): void {
  void client.invalidateQueries({ queryKey: ['pools'] });
  void client.invalidateQueries({ queryKey: ['positions'] });
  void client.invalidateQueries({ queryKey: ['balance'] });
  if (address) {
    void client.invalidateQueries({ queryKey: ['pool', address] });
    void client.invalidateQueries({ queryKey: queryKeys.activity(address) });
  }
}
