// Typed fakes for service and route tests: an in-memory store, a fake chain reader, and a
// signer that behaves like a wallet's `signMessage`. Test support only.
import { createPrivateKey, sign } from 'node:crypto';

import { Keypair, PublicKey } from '@solana/web3.js';

import type { PoolMetadataDto } from '@aquastock/types';

import type { PoolEvents } from './activity';
import type { ChainDeployment, ChainPool, ChainPosition } from './chain';
import type { ChainReader } from './reader';
import { encodeCursor, type ActivityCursor } from './schemas';
import type { PoolServiceDeps } from './service';
import type { ActivityInput, PoolIdentity, PoolStore } from './store';

export const PROGRAM_ID = new PublicKey(
  '92EVZikCaJ1SXTJAq7e8NzzZg5zLKjK2LyX14SQeQRfE',
);
export const NOW = 1_800_000_000;

export const newKey = (): PublicKey => Keypair.generate().publicKey;

export function makePool(overrides: Partial<ChainPool> = {}): ChainPool {
  return {
    address: newKey(),
    sponsor: newKey(),
    mint: newKey(),
    vault: newKey(),
    poolId: 1n,
    matchBps: 10_000,
    perSaverCap: 100n * 10n ** 8n,
    vestingSeconds: 1_000,
    createdAt: NOW - 500,
    endsAt: NOW + 86_400,
    budgetTotal: 500n * 10n ** 8n,
    reserved: 100n * 10n ** 8n,
    claimed: 0n,
    depositsTotal: 100n * 10n ** 8n,
    ...overrides,
  };
}

export function makePosition(
  pool: ChainPool,
  overrides: Partial<ChainPosition> = {},
): ChainPosition {
  return {
    address: newKey(),
    pool: pool.address,
    saver: newKey(),
    deposited: 100n * 10n ** 8n,
    matchReserved: 100n * 10n ** 8n,
    matchClaimed: 0n,
    startedAt: NOW - 250,
    settled: false,
    ...overrides,
  };
}

export interface FakeChain extends ChainReader {
  pools_: ChainPool[];
  positions_: ChainPosition[];
  events_: Map<string, PoolEvents[]>;
  poolCalls: number;
}

export function fakeChain(
  pools: ChainPool[] = [],
  positions: ChainPosition[] = [],
): FakeChain {
  const chain: FakeChain = {
    programId: PROGRAM_ID,
    pools_: pools,
    positions_: positions,
    events_: new Map(),
    poolCalls: 0,
    pools: () => Promise.resolve(chain.pools_),
    pool: (address) => {
      chain.poolCalls += 1;
      return Promise.resolve(
        chain.pools_.find((pool) => pool.address.equals(address)) ?? null,
      );
    },
    positionsFor: (wallet) =>
      Promise.resolve(chain.positions_.filter((p) => p.saver.equals(wallet))),
    position: (pool, saver) =>
      Promise.resolve(
        chain.positions_.find(
          (p) => p.pool.equals(pool) && p.saver.equals(saver),
        ) ?? null,
      ),
    deployment: (network): Promise<ChainDeployment> =>
      Promise.resolve({
        programId: PROGRAM_ID.toBase58(),
        network,
        allowedMint: null,
        upgradeAuthority: null,
        issuer: null,
      }),
    transactionEvents: (signature) =>
      Promise.resolve(chain.events_.get(signature) ?? []),
  };
  return chain;
}

interface StoredPool extends PoolIdentity {
  metadata: PoolMetadataDto;
}

export interface MemoryStore extends PoolStore {
  pools: Map<string, StoredPool>;
  activities: Map<string, ActivityInput & { pool: string; id: string }>;
}

export function memoryStore(): MemoryStore {
  const pools = new Map<string, StoredPool>();
  const activities = new Map<
    string,
    ActivityInput & { pool: string; id: string }
  >();
  let counter = 0;

  return {
    pools,
    activities,
    metadataFor: (programId, addresses) =>
      Promise.resolve(
        new Map(
          addresses.flatMap((address) => {
            const row = pools.get(address);
            return row && row.programId === programId
              ? [[address, row.metadata] as [string, PoolMetadataDto]]
              : [];
          }),
        ),
      ),
    saveMetadata: (identity, metadata) => {
      pools.set(identity.onchainAddress, { ...identity, metadata });
      return Promise.resolve();
    },
    ensurePool: (identity) => {
      if (!pools.has(identity.onchainAddress)) {
        pools.set(identity.onchainAddress, {
          ...identity,
          metadata: { name: `Pool #${identity.poolId}`, description: null },
        });
      }
      return Promise.resolve();
    },
    recordActivities: (onchainAddress, rows) => {
      if (!pools.has(onchainAddress)) return Promise.resolve(0);
      let added = 0;
      for (const row of rows) {
        const key = `${row.txSignature}:${row.eventIndex}`;
        if (activities.has(key)) continue;
        counter += 1;
        activities.set(key, {
          ...row,
          pool: onchainAddress,
          id: `id${String(counter).padStart(6, '0')}`,
        });
        added += 1;
      }
      return Promise.resolve(added);
    },
    activityPage: (
      onchainAddress,
      { limit, cursor }: { limit: number; cursor: ActivityCursor | null },
    ) => {
      const sorted = [...activities.values()]
        .filter((row) => row.pool === onchainAddress)
        .sort(
          (a, b) =>
            b.occurredAt.getTime() - a.occurredAt.getTime() ||
            b.id.localeCompare(a.id),
        );
      const start = cursor
        ? sorted.findIndex(
            (row) =>
              row.occurredAt.toISOString() === cursor.t && row.id === cursor.id,
          ) + 1
        : 0;
      const page = sorted.slice(start, start + limit);
      const last = page.at(-1);
      return Promise.resolve({
        items: page.map((row) => ({
          id: row.id,
          kind: row.kind,
          wallet: row.wallet,
          amount: row.amount?.toString() ?? null,
          matchAmount: row.matchAmount?.toString() ?? null,
          txSignature: row.txSignature,
          occurredAt: row.occurredAt.toISOString(),
        })),
        nextCursor:
          start + limit < sorted.length && last
            ? encodeCursor({ t: last.occurredAt.toISOString(), id: last.id })
            : null,
      });
    },
  };
}

export function makeDeps(
  chain: ChainReader,
  store: PoolStore,
  now: () => number = () => NOW,
): PoolServiceDeps {
  return { chain, store, now, network: 'localnet', stockMint: null };
}

// DER prefix that wraps a 32-byte Ed25519 seed as a PKCS#8 private key.
const PKCS8_ED25519_PREFIX = Buffer.from(
  '302e020100300506032b657004220420',
  'hex',
);

/** Signs like a wallet's `signMessage`, returning canonical base64. */
export function signBase64(keypair: Keypair, message: string): string {
  const key = createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, keypair.secretKey.slice(0, 32)]),
    format: 'der',
    type: 'pkcs8',
  });
  return sign(null, Buffer.from(message), key).toString('base64');
}
