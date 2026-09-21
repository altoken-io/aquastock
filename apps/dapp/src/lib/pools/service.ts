// The use cases behind the API and the server-rendered pages. Chain and database are
// injected, so this is testable without either. The chain decides every number; the
// database only adds descriptions and a verified activity feed.
import { PublicKey } from '@solana/web3.js';

import type {
  DeploymentDto,
  MyPositionDto,
  PoolActivityPageDto,
  PoolDto,
  PoolMetadataDto,
  PositionDto,
} from '@aquastock/types';

import { ApiError } from '../api/errors';
import type { ChainPool } from './chain';
import { toPoolDto, toPositionDto } from './mappers';
import type { ChainReader } from './reader';
import { decodeCursor, type SaveMetadataBody } from './schemas';
import { buildMetadataMessage, isFresh, verifyEd25519 } from './signed-message';
import type { PoolStore } from './store';

export interface PoolServiceDeps {
  chain: ChainReader;
  store: PoolStore;
  /** Unix seconds. Injected so tests control time. */
  now: () => number;
  network: string;
  stockMint: PublicKey | null;
}

export interface ListPoolsQuery {
  sponsor?: string;
  status: 'open' | 'ended' | 'all';
  limit: number;
}

function identityOf(deps: PoolServiceDeps, pool: ChainPool) {
  return {
    programId: deps.chain.programId.toBase58(),
    onchainAddress: pool.address.toBase58(),
    sponsorWallet: pool.sponsor.toBase58(),
    poolId: pool.poolId,
  };
}

export async function listPools(
  deps: PoolServiceDeps,
  query: ListPoolsQuery,
): Promise<{ pools: PoolDto[]; total: number }> {
  const now = deps.now();
  const matching = (await deps.chain.pools())
    .filter(
      (pool) => !query.sponsor || pool.sponsor.toBase58() === query.sponsor,
    )
    .filter((pool) =>
      query.status === 'all'
        ? true
        : query.status === 'open'
          ? now < pool.endsAt
          : now >= pool.endsAt,
    )
    // Newest first; the address breaks ties so the order is stable between requests.
    .sort(
      (a, b) =>
        b.createdAt - a.createdAt ||
        a.address.toBase58().localeCompare(b.address.toBase58()),
    );

  const page = matching.slice(0, query.limit);
  const metadata = await deps.store.metadataFor(
    deps.chain.programId.toBase58(),
    page.map((pool) => pool.address.toBase58()),
  );
  return {
    pools: page.map((pool) =>
      toPoolDto(pool, metadata.get(pool.address.toBase58()) ?? null),
    ),
    total: matching.length,
  };
}

export interface PoolDetail {
  pool: PoolDto;
  activity: PoolActivityPageDto;
  /** The requesting wallet's position in this pool, if a wallet was given and has one. */
  position: PositionDto | null;
}

export async function getPoolDetail(
  deps: PoolServiceDeps,
  address: string,
  wallet: string | undefined,
): Promise<PoolDetail> {
  const pool = await deps.chain.pool(new PublicKey(address));
  if (!pool) {
    throw new ApiError(404, 'pool_not_found', 'no pool exists at this address');
  }
  const [metadata, activity, position] = await Promise.all([
    deps.store.metadataFor(deps.chain.programId.toBase58(), [address]),
    deps.store.activityPage(address, { limit: 20, cursor: null }),
    wallet
      ? deps.chain.position(pool.address, new PublicKey(wallet))
      : Promise.resolve(null),
  ]);
  return {
    pool: toPoolDto(pool, metadata.get(address) ?? null),
    activity,
    position: position
      ? toPositionDto(position, pool.vestingSeconds, deps.now())
      : null,
  };
}

export async function listActivity(
  deps: PoolServiceDeps,
  address: string,
  query: { limit: number; cursor?: string },
): Promise<PoolActivityPageDto> {
  const cursor = query.cursor ? decodeCursor(query.cursor) : null;
  if (query.cursor && !cursor) {
    throw new ApiError(400, 'invalid_cursor', 'cursor is not valid');
  }
  return deps.store.activityPage(address, { limit: query.limit, cursor });
}

export async function getPositions(
  deps: PoolServiceDeps,
  wallet: string,
): Promise<MyPositionDto[]> {
  const positions = await deps.chain.positionsFor(new PublicKey(wallet));
  const addresses = [...new Set(positions.map((p) => p.pool.toBase58()))];
  const pools = new Map<string, ChainPool>();
  await Promise.all(
    addresses.map(async (poolAddress) => {
      const pool = await deps.chain.pool(new PublicKey(poolAddress));
      if (pool) pools.set(poolAddress, pool);
    }),
  );
  const metadata = await deps.store.metadataFor(
    deps.chain.programId.toBase58(),
    [...pools.keys()],
  );

  const now = deps.now();
  return positions
    .flatMap((position): MyPositionDto[] => {
      const key = position.pool.toBase58();
      const pool = pools.get(key);
      if (!pool) return [];
      return [
        {
          position: toPositionDto(position, pool.vestingSeconds, now),
          pool: toPoolDto(pool, metadata.get(key) ?? null),
        },
      ];
    })
    .sort((a, b) => b.pool.createdAt - a.pool.createdAt);
}

export function getDeployment(deps: PoolServiceDeps): Promise<DeploymentDto> {
  return deps.chain.deployment(deps.network, deps.stockMint, deps.now());
}

/**
 * Saves a pool's name and description, if the pool's sponsor signed it. The signature is
 * checked against the sponsor recorded on-chain, so only the wallet that created the
 * pool can describe it.
 */
export async function saveMetadata(
  deps: PoolServiceDeps,
  address: string,
  body: SaveMetadataBody,
): Promise<PoolMetadataDto> {
  if (!isFresh(body.issuedAt, deps.now())) {
    throw new ApiError(
      401,
      'stale_signature',
      'the signed message has expired; sign again',
    );
  }
  const pool = await deps.chain.pool(new PublicKey(address));
  if (!pool) {
    throw new ApiError(404, 'pool_not_found', 'no pool exists at this address');
  }

  const message = buildMetadataMessage({
    programId: deps.chain.programId.toBase58(),
    pool: address,
    name: body.name,
    description: body.description,
    issuedAt: body.issuedAt,
  });
  const valid = verifyEd25519(
    pool.sponsor.toBytes(),
    Buffer.from(message),
    Buffer.from(body.signature, 'base64'),
  );
  if (!valid) {
    throw new ApiError(
      401,
      'invalid_signature',
      "the signature does not match this pool's sponsor",
    );
  }

  const metadata = { name: body.name, description: body.description };
  await deps.store.saveMetadata(identityOf(deps, pool), metadata);
  return metadata;
}

/** Records the events of a confirmed transaction, after re-reading it from the chain. */
export async function recordTransaction(
  deps: PoolServiceDeps,
  signature: string,
): Promise<{ events: number; recorded: number }> {
  const groups = await deps.chain.transactionEvents(signature);
  let events = 0;
  let recorded = 0;
  for (const { pool: poolKey, rows } of groups) {
    const pool = await deps.chain.pool(poolKey);
    if (!pool) continue;
    await deps.store.ensurePool(identityOf(deps, pool));
    events += rows.length;
    recorded += await deps.store.recordActivities(poolKey.toBase58(), rows);
  }
  return { events, recorded };
}
