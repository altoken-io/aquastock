// @vitest-environment node
//
// Runs against a real Postgres, but only when INTEGRATION_DATABASE_URL is set AND points at
// localhost. It deliberately ignores DATABASE_URL: a stray production URL in the
// environment must never be able to make this suite write to a real database.
//
//   INTEGRATION_DATABASE_URL=postgresql://postgres:postgres@localhost:5434/aquastock \
//     pnpm --filter dapp exec vitest run src/lib/pools/store.integration.test.ts
import { createPrismaClient, type PrismaClient } from '@aquastock/db-prisma';
import { Keypair } from '@solana/web3.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { encodeCursor } from './schemas';
import {
  createPrismaPoolStore,
  type ActivityInput,
  type PoolIdentity,
} from './store';

const url = process.env.INTEGRATION_DATABASE_URL;
if (
  url &&
  !/^postgres(ql)?:\/\/[^@/]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)
) {
  throw new Error(
    'INTEGRATION_DATABASE_URL must point at localhost; refusing to run against another database',
  );
}

const U64_MAX = 18_446_744_073_709_551_615n;
const PROGRAM = Keypair.generate().publicKey.toBase58();
const created: string[] = [];

function identity(overrides: Partial<PoolIdentity> = {}): PoolIdentity {
  const onchainAddress = Keypair.generate().publicKey.toBase58();
  created.push(onchainAddress);
  return {
    programId: PROGRAM,
    onchainAddress,
    sponsorWallet: Keypair.generate().publicKey.toBase58(),
    poolId: 7n,
    ...overrides,
  };
}

// Base58 has no 0, O, I or l, so encode the counter with letters that are all valid.
function fakeSignature(n: number): string {
  const suffix = [...n.toString(8)]
    .map((digit) => 'abcdefgh'[Number(digit)])
    .join('');
  return suffix.padStart(88, '4');
}

let sigCounter = 0;
function activity(overrides: Partial<ActivityInput> = {}): ActivityInput {
  sigCounter += 1;
  return {
    kind: 'DEPOSITED',
    wallet: Keypair.generate().publicKey.toBase58(),
    amount: 1n,
    matchAmount: null,
    txSignature: fakeSignature(sigCounter),
    eventIndex: 0,
    occurredAt: new Date('2026-09-20T12:00:00.000Z'),
    ...overrides,
  };
}

describe.skipIf(!url)('Prisma pool store (real Postgres)', () => {
  let client: PrismaClient;
  let store: ReturnType<typeof createPrismaPoolStore>;

  beforeAll(() => {
    client = createPrismaClient(url ?? '', { poolMax: 10 });
    store = createPrismaPoolStore(client);
  });

  afterAll(async () => {
    // Activity rows go with their pool (ON DELETE CASCADE).
    await client.pool.deleteMany({
      where: { onchainAddress: { in: created } },
    });
    await client.$disconnect();
  });

  it('ensurePool creates a default-named row and never overwrites an existing one', async () => {
    const pool = identity({ poolId: 42n });
    await store.ensurePool(pool);
    expect(
      (await store.metadataFor(PROGRAM, [pool.onchainAddress])).get(
        pool.onchainAddress,
      ),
    ).toEqual({
      name: 'Pool #42',
      description: null,
    });

    await store.saveMetadata(pool, {
      name: 'Chosen by the sponsor',
      description: 'Kept',
    });
    await store.ensurePool({
      ...pool,
      sponsorWallet: Keypair.generate().publicKey.toBase58(),
    });
    expect(
      (await store.metadataFor(PROGRAM, [pool.onchainAddress])).get(
        pool.onchainAddress,
      )?.name,
    ).toBe('Chosen by the sponsor');
  });

  it('saveMetadata creates, updates, and survives concurrent saves without a duplicate error', async () => {
    const pool = identity();
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        store.saveMetadata(pool, { name: `Name ${i}`, description: null }),
      ),
    );
    expect(
      await client.pool.count({
        where: { onchainAddress: pool.onchainAddress },
      }),
    ).toBe(1);

    await store.saveMetadata(pool, { name: 'Final', description: 'Text' });
    expect(
      (await store.metadataFor(PROGRAM, [pool.onchainAddress])).get(
        pool.onchainAddress,
      ),
    ).toEqual({
      name: 'Final',
      description: 'Text',
    });
  });

  it('scopes metadata to the deployment and handles an empty lookup', async () => {
    const pool = identity();
    await store.saveMetadata(pool, { name: 'Mine', description: null });
    expect(
      await store.metadataFor(Keypair.generate().publicKey.toBase58(), [
        pool.onchainAddress,
      ]),
    ).toEqual(new Map());
    expect(await store.metadataFor(PROGRAM, [])).toEqual(new Map());
  });

  it('stores a full-range u64 pool id exactly', async () => {
    const pool = identity({ poolId: U64_MAX });
    await store.saveMetadata(pool, { name: 'Max id', description: null });
    const row = await client.pool.findUnique({
      where: { onchainAddress: pool.onchainAddress },
    });
    expect(BigInt(row?.poolId.toFixed(0) ?? '-1')).toBe(U64_MAX);
  });

  it('recordActivities is idempotent and only counts new rows', async () => {
    const pool = identity();
    await store.ensurePool(pool);
    const [a, b, c] = [activity(), activity(), activity()];
    expect(await store.recordActivities(pool.onchainAddress, [a, b])).toBe(2);
    expect(await store.recordActivities(pool.onchainAddress, [a, b])).toBe(0);
    expect(await store.recordActivities(pool.onchainAddress, [a, c])).toBe(1);
    expect(
      (
        await store.activityPage(pool.onchainAddress, {
          limit: 50,
          cursor: null,
        })
      ).items,
    ).toHaveLength(3);
  });

  it('records several events of one transaction, and a pool with no row records nothing', async () => {
    const pool = identity();
    await store.ensurePool(pool);
    const sig = '9'.repeat(88);
    expect(
      await store.recordActivities(pool.onchainAddress, [
        activity({ txSignature: sig, eventIndex: 0 }),
        activity({ txSignature: sig, eventIndex: 1, kind: 'MATCH_FUNDED' }),
      ]),
    ).toBe(2);
    const unknown = identity();
    expect(
      await store.recordActivities(unknown.onchainAddress, [activity()]),
    ).toBe(0);
  });

  it('keeps u64 amounts exact through the database', async () => {
    const pool = identity();
    await store.ensurePool(pool);
    await store.recordActivities(pool.onchainAddress, [
      activity({ amount: U64_MAX, matchAmount: U64_MAX - 1n }),
    ]);
    const [item] = (
      await store.activityPage(pool.onchainAddress, { limit: 5, cursor: null })
    ).items;
    expect([item?.amount, item?.matchAmount]).toEqual([
      U64_MAX.toString(),
      (U64_MAX - 1n).toString(),
    ]);
  });

  it('paginates by keyset: every row exactly once, newest first, even with tied timestamps', async () => {
    const pool = identity();
    await store.ensurePool(pool);
    // Groups of three rows share a timestamp, so only the id tiebreak keeps pages stable.
    const rows = Array.from({ length: 13 }, (_, i) =>
      activity({
        occurredAt: new Date(
          Date.UTC(2026, 8, 20, 12, 0, 0) - Math.floor(i / 3) * 1000,
        ),
      }),
    );
    await store.recordActivities(pool.onchainAddress, rows);

    const seen: { id: string; at: string }[] = [];
    let cursor = null;
    for (let guard = 0; guard < 10; guard += 1) {
      const page = await store.activityPage(pool.onchainAddress, {
        limit: 5,
        cursor,
      });
      seen.push(
        ...page.items.map((item) => ({ id: item.id, at: item.occurredAt })),
      );
      if (!page.nextCursor) break;
      const decoded: unknown = JSON.parse(
        Buffer.from(page.nextCursor, 'base64url').toString('utf8'),
      );
      cursor =
        typeof decoded === 'object' &&
        decoded !== null &&
        't' in decoded &&
        'id' in decoded
          ? { t: String(decoded.t), id: String(decoded.id) }
          : null;
    }
    expect(seen).toHaveLength(13);
    expect(new Set(seen.map((s) => s.id)).size).toBe(13);
    const times = seen.map((s) => s.at);
    expect([...times].sort().reverse()).toEqual(times);
    expect(
      encodeCursor({ t: '2026-09-20T12:00:00.000Z', id: 'x' }),
    ).toBeTruthy();
  });

  it('returns an empty page for an unknown pool', async () => {
    expect(
      await store.activityPage(Keypair.generate().publicKey.toBase58(), {
        limit: 5,
        cursor: null,
      }),
    ).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('the database itself refuses what validation should already have caught', async () => {
    const pool = identity();
    await expect(
      store.saveMetadata(pool, { name: '', description: null }),
    ).rejects.toThrow();
    await expect(
      store.saveMetadata(pool, { name: 'x'.repeat(81), description: null }),
    ).rejects.toThrow();
    await expect(
      store.saveMetadata(identity({ onchainAddress: 'not-base58-0OIl' }), {
        name: 'ok',
        description: null,
      }),
    ).rejects.toThrow();
    await expect(
      store.saveMetadata(identity({ poolId: U64_MAX + 1n }), {
        name: 'ok',
        description: null,
      }),
    ).rejects.toThrow();
  });

  it('deleting a pool removes its activity', async () => {
    const pool = identity();
    await store.ensurePool(pool);
    await store.recordActivities(pool.onchainAddress, [activity(), activity()]);
    await client.pool.delete({
      where: { onchainAddress: pool.onchainAddress },
    });
    expect(
      await client.poolActivity.count({
        where: { pool: { onchainAddress: pool.onchainAddress } },
      }),
    ).toBe(0);
  });
});
