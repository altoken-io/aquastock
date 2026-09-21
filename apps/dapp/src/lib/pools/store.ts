// The database side: pool metadata and verified activity. Written against a small
// interface so the service can be tested without a database.
import { Prisma, type PrismaClient } from '@aquastock/db-prisma';
import type {
  PoolActivityDto,
  PoolActivityKind,
  PoolActivityPageDto,
  PoolMetadataDto,
} from '@aquastock/types';

import { encodeCursor, type ActivityCursor } from './schemas';
import { placeholderPoolName } from './naming';

export interface ActivityInput {
  kind: PoolActivityKind;
  wallet: string;
  amount: bigint | null;
  matchAmount: bigint | null;
  txSignature: string;
  eventIndex: number;
  occurredAt: Date;
}

export interface PoolIdentity {
  programId: string;
  onchainAddress: string;
  sponsorWallet: string;
  poolId: bigint;
}

export interface PoolStore {
  metadataFor(
    programId: string,
    addresses: string[],
  ): Promise<Map<string, PoolMetadataDto>>;
  /** Creates or updates the descriptive fields of a pool that exists on-chain. */
  saveMetadata(
    identity: PoolIdentity,
    metadata: PoolMetadataDto,
  ): Promise<void>;
  /** Creates a default-named row if none exists. Never overwrites a sponsor's text. */
  ensurePool(identity: PoolIdentity): Promise<void>;
  /** Idempotent by (txSignature, eventIndex). Returns how many rows were new. */
  recordActivities(
    onchainAddress: string,
    rows: ActivityInput[],
  ): Promise<number>;
  activityPage(
    onchainAddress: string,
    options: { limit: number; cursor: ActivityCursor | null },
  ): Promise<PoolActivityPageDto>;
}

const decimal = (value: bigint | null): Prisma.Decimal | null =>
  value === null ? null : new Prisma.Decimal(value.toString());

export function createPrismaPoolStore(client: PrismaClient): PoolStore {
  return {
    async metadataFor(programId, addresses) {
      if (addresses.length === 0) return new Map();
      const rows = await client.pool.findMany({
        where: { programId, onchainAddress: { in: addresses } },
        select: { onchainAddress: true, name: true, description: true },
      });
      return new Map(
        rows.map((row) => [
          row.onchainAddress,
          { name: row.name, description: row.description },
        ]),
      );
    },

    async saveMetadata(identity, metadata) {
      const poolId = decimal(identity.poolId);
      if (poolId === null) throw new Error('poolId is required');
      // A single INSERT ... ON CONFLICT, so two concurrent saves cannot race.
      await client.pool.upsert({
        where: { onchainAddress: identity.onchainAddress },
        create: {
          onchainAddress: identity.onchainAddress,
          programId: identity.programId,
          sponsorWallet: identity.sponsorWallet,
          poolId,
          name: metadata.name,
          description: metadata.description,
        },
        update: { name: metadata.name, description: metadata.description },
      });
    },

    async ensurePool(identity) {
      const poolId = decimal(identity.poolId);
      if (poolId === null) throw new Error('poolId is required');
      await client.pool.createMany({
        data: [
          {
            onchainAddress: identity.onchainAddress,
            programId: identity.programId,
            sponsorWallet: identity.sponsorWallet,
            poolId,
            name: placeholderPoolName(identity.poolId.toString()),
          },
        ],
        skipDuplicates: true,
      });
    },

    async recordActivities(onchainAddress, rows) {
      if (rows.length === 0) return 0;
      const pool = await client.pool.findUnique({
        where: { onchainAddress },
        select: { id: true },
      });
      if (!pool) return 0;
      const result = await client.poolActivity.createMany({
        data: rows.map((row) => ({
          poolId: pool.id,
          kind: row.kind,
          wallet: row.wallet,
          amount: decimal(row.amount),
          matchAmount: decimal(row.matchAmount),
          txSignature: row.txSignature,
          eventIndex: row.eventIndex,
          occurredAt: row.occurredAt,
        })),
        skipDuplicates: true,
      });
      return result.count;
    },

    async activityPage(onchainAddress, { limit, cursor }) {
      const pool = await client.pool.findUnique({
        where: { onchainAddress },
        select: { id: true },
      });
      if (!pool) return { items: [], nextCursor: null };

      // Keyset pagination on (occurredAt, id): the same cost on page 1 and page 1000.
      const after = cursor
        ? {
            OR: [
              { occurredAt: { lt: new Date(cursor.t) } },
              { occurredAt: new Date(cursor.t), id: { lt: cursor.id } },
            ],
          }
        : {};
      const rows = await client.poolActivity.findMany({
        where: { poolId: pool.id, ...after },
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      });

      const page = rows.slice(0, limit);
      const last = page.at(-1);
      const items: PoolActivityDto[] = page.map((row) => ({
        id: row.id,
        kind: row.kind,
        wallet: row.wallet,
        amount: row.amount ? row.amount.toFixed(0) : null,
        matchAmount: row.matchAmount ? row.matchAmount.toFixed(0) : null,
        txSignature: row.txSignature,
        occurredAt: row.occurredAt.toISOString(),
      }));
      return {
        items,
        nextCursor:
          rows.length > limit && last
            ? encodeCursor({ t: last.occurredAt.toISOString(), id: last.id })
            : null,
      };
    },
  };
}
