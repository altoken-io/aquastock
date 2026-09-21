// @vitest-environment node
import { Keypair } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { ApiError } from '../api/errors';
import {
  NOW,
  fakeChain,
  makeDeps,
  makePool,
  makePosition,
  memoryStore,
  newKey,
  signBase64,
} from './test-fakes';
import { buildMetadataMessage } from './signed-message';
import {
  getPoolDetail,
  getPositions,
  listActivity,
  listPools,
  recordTransaction,
  saveMetadata,
} from './service';
import type { ActivityInput } from './store';

const TX = '5'.repeat(88);
const ONE = 10n ** 8n;

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('expected the call to be rejected');
}

describe('listPools', () => {
  const sponsorA = newKey();
  const open = makePool({ sponsor: sponsorA, createdAt: NOW - 100 });
  const older = makePool({ sponsor: sponsorA, createdAt: NOW - 900 });
  const ended = makePool({ createdAt: NOW - 5_000, endsAt: NOW - 10 });

  it('returns newest first with a total', async () => {
    const deps = makeDeps(fakeChain([older, ended, open]), memoryStore());
    const { pools, total } = await listPools(deps, {
      status: 'all',
      limit: 50,
    });
    expect(total).toBe(3);
    expect(pools.map((p) => p.address)).toEqual([
      open.address.toBase58(),
      older.address.toBase58(),
      ended.address.toBase58(),
    ]);
    expect(pools.every((p) => p.metadata === null)).toBe(true);
  });

  it("never shows metadata saved for a different program's pool", async () => {
    const store = memoryStore();
    await store.saveMetadata(
      {
        programId: 'SomeOtherProgram1111111111111111111111111111',
        onchainAddress: open.address.toBase58(),
        sponsorWallet: sponsorA.toBase58(),
        poolId: 1n,
      },
      { name: 'Wrong deployment', description: null },
    );
    const deps = makeDeps(fakeChain([open]), store);
    const { pools } = await listPools(deps, { status: 'all', limit: 50 });
    expect(pools[0]?.metadata).toBeNull();
  });

  it('filters by sponsor and status, and limits', async () => {
    const deps = makeDeps(fakeChain([older, ended, open]), memoryStore());
    const bySponsor = await listPools(deps, {
      sponsor: sponsorA.toBase58(),
      status: 'all',
      limit: 50,
    });
    expect(bySponsor.total).toBe(2);
    expect(
      (await listPools(deps, { status: 'ended', limit: 50 })).pools.map(
        (p) => p.address,
      ),
    ).toEqual([ended.address.toBase58()]);
    expect((await listPools(deps, { status: 'open', limit: 50 })).total).toBe(
      2,
    );
    const limited = await listPools(deps, { status: 'all', limit: 1 });
    expect(limited.pools).toHaveLength(1);
    expect(limited.total).toBe(3);
  });

  it('shows the sponsor-supplied name when there is one', async () => {
    const store = memoryStore();
    const deps = makeDeps(fakeChain([open]), store);
    await store.saveMetadata(
      {
        programId: deps.chain.programId.toBase58(),
        onchainAddress: open.address.toBase58(),
        sponsorWallet: sponsorA.toBase58(),
        poolId: 1n,
      },
      { name: 'Contractor match', description: 'For contributors' },
    );
    const { pools } = await listPools(deps, { status: 'all', limit: 50 });
    expect(pools[0]?.metadata).toEqual({
      name: 'Contractor match',
      description: 'For contributors',
    });
  });

  it('computes unreserved and clamps a bad read to zero', async () => {
    const odd = makePool({ budgetTotal: 5n, reserved: 9n });
    const deps = makeDeps(fakeChain([odd, open]), memoryStore());
    const { pools } = await listPools(deps, { status: 'all', limit: 50 });
    expect(
      pools.find((p) => p.address === odd.address.toBase58())?.unreserved,
    ).toBe('0');
    expect(
      pools.find((p) => p.address === open.address.toBase58())?.unreserved,
    ).toBe((400n * ONE).toString());
  });
});

describe('getPoolDetail', () => {
  it('throws 404 for an address that is not a pool', async () => {
    const deps = makeDeps(fakeChain([]), memoryStore());
    const error = await rejection(
      getPoolDetail(deps, newKey().toBase58(), undefined),
    );
    expect([error.status, error.code]).toEqual([404, 'pool_not_found']);
  });

  it("includes the wallet's position with vesting computed from the on-chain rules", async () => {
    const pool = makePool();
    const position = makePosition(pool, { startedAt: NOW - 250 });
    const deps = makeDeps(fakeChain([pool], [position]), memoryStore());
    const detail = await getPoolDetail(
      deps,
      pool.address.toBase58(),
      position.saver.toBase58(),
    );
    expect(detail.position).toMatchObject({
      deposited: (100n * ONE).toString(),
      vested: (25n * ONE).toString(),
      claimable: (25n * ONE).toString(),
      settled: false,
      asOf: NOW,
    });
  });

  it('has no position without a wallet, or for a wallet with none', async () => {
    const pool = makePool();
    const deps = makeDeps(
      fakeChain([pool], [makePosition(pool)]),
      memoryStore(),
    );
    expect(
      (await getPoolDetail(deps, pool.address.toBase58(), undefined)).position,
    ).toBeNull();
    expect(
      (await getPoolDetail(deps, pool.address.toBase58(), newKey().toBase58()))
        .position,
    ).toBeNull();
  });

  it('does not treat what has vested as claimed', async () => {
    const pool = makePool();
    const position = makePosition(pool, {
      matchClaimed: 10n * ONE,
      startedAt: NOW - 250,
    });
    const deps = makeDeps(fakeChain([pool], [position]), memoryStore());
    const detail = await getPoolDetail(
      deps,
      pool.address.toBase58(),
      position.saver.toBase58(),
    );
    expect(detail.position?.matchClaimed).toBe((10n * ONE).toString());
    expect(detail.position?.claimable).toBe((15n * ONE).toString());
  });
});

describe('getPositions', () => {
  it('joins pools, sorts newest first, and drops positions whose pool is gone', async () => {
    const saver = newKey();
    const newer = makePool({ createdAt: NOW - 10 });
    const older = makePool({ createdAt: NOW - 1_000 });
    const orphanPool = makePool();
    const positions = [
      makePosition(older, { saver }),
      makePosition(newer, { saver }),
      makePosition(orphanPool, { saver }),
    ];
    const deps = makeDeps(fakeChain([older, newer], positions), memoryStore());
    const result = await getPositions(deps, saver.toBase58());
    expect(result.map((r) => r.pool.address)).toEqual([
      newer.address.toBase58(),
      older.address.toBase58(),
    ]);
  });

  it('shows a settled position as fully vested with nothing new to claim after a claim', async () => {
    const saver = newKey();
    const pool = makePool();
    const settled = makePosition(pool, {
      saver,
      settled: true,
      deposited: 0n,
      matchReserved: 25n * ONE,
      matchClaimed: 25n * ONE,
    });
    const deps = makeDeps(fakeChain([pool], [settled]), memoryStore());
    const [entry] = await getPositions(deps, saver.toBase58());
    expect(entry?.position).toMatchObject({
      vested: (25n * ONE).toString(),
      claimable: '0',
    });
  });

  it('is empty for a wallet with no positions', async () => {
    const deps = makeDeps(fakeChain([makePool()]), memoryStore());
    expect(await getPositions(deps, newKey().toBase58())).toEqual([]);
  });
});

describe('saveMetadata', () => {
  const sponsor = Keypair.generate();
  const pool = makePool({ sponsor: sponsor.publicKey });
  const address = pool.address.toBase58();

  function signed(
    overrides: {
      name?: string;
      description?: string | null;
      issuedAt?: number;
      signer?: Keypair;
      pool?: string;
    } = {},
  ) {
    const fields = {
      programId: 'ignored-below',
      pool: overrides.pool ?? address,
      name: overrides.name ?? 'Contractor match',
      description:
        overrides.description === undefined
          ? 'For contributors'
          : overrides.description,
      issuedAt: overrides.issuedAt ?? NOW,
    };
    return { fields, deps: makeDeps(fakeChain([pool]), memoryStore()) };
  }

  function bodyFor(
    deps: ReturnType<typeof makeDeps>,
    fields: ReturnType<typeof signed>['fields'],
    signer: Keypair,
  ) {
    const message = buildMetadataMessage({
      ...fields,
      programId: deps.chain.programId.toBase58(),
    });
    return {
      name: fields.name,
      description: fields.description,
      issuedAt: fields.issuedAt,
      signature: signBase64(signer, message),
    };
  }

  it("saves when the pool's sponsor signed the exact fields", async () => {
    const { fields, deps } = signed();
    const saved = await saveMetadata(
      deps,
      address,
      bodyFor(deps, fields, sponsor),
    );
    expect(saved).toEqual({
      name: 'Contractor match',
      description: 'For contributors',
    });
    const stored = await deps.store.metadataFor(
      deps.chain.programId.toBase58(),
      [address],
    );
    expect(stored.get(address)).toEqual(saved);
  });

  it('refuses a signature from anyone but the sponsor, and stores nothing', async () => {
    const { fields, deps } = signed();
    const error = await rejection(
      saveMetadata(deps, address, bodyFor(deps, fields, Keypair.generate())),
    );
    expect([error.status, error.code]).toEqual([401, 'invalid_signature']);
    expect(
      (await deps.store.metadataFor(deps.chain.programId.toBase58(), [address]))
        .size,
    ).toBe(0);
  });

  it('refuses a signature over different text than what is submitted', async () => {
    const { fields, deps } = signed();
    const body = bodyFor(deps, fields, sponsor);
    for (const tampered of [
      { ...body, name: 'Changed name' },
      { ...body, description: 'Changed' },
      { ...body, description: null },
    ]) {
      expect(
        (await rejection(saveMetadata(deps, address, tampered))).code,
      ).toBe('invalid_signature');
    }
  });

  it("cannot replay one pool's signature on another pool by the same sponsor", async () => {
    const other = makePool({ sponsor: sponsor.publicKey });
    const deps = makeDeps(fakeChain([pool, other]), memoryStore());
    const body = bodyFor(deps, signed().fields, sponsor);
    const error = await rejection(
      saveMetadata(deps, other.address.toBase58(), body),
    );
    expect(error.code).toBe('invalid_signature');
  });

  it('refuses stale and future-dated messages before doing any chain work', async () => {
    const { fields, deps } = signed();
    for (const issuedAt of [NOW - 601, NOW + 121, NOW - 86_400]) {
      const error = await rejection(
        saveMetadata(
          deps,
          address,
          bodyFor(deps, { ...fields, issuedAt }, sponsor),
        ),
      );
      expect([error.status, error.code]).toEqual([401, 'stale_signature']);
    }
    expect((deps.chain as ReturnType<typeof fakeChain>).poolCalls).toBe(0);
  });

  it('is a 404 for a pool that does not exist', async () => {
    const { fields, deps } = signed();
    const ghost = newKey().toBase58();
    const error = await rejection(
      saveMetadata(
        deps,
        ghost,
        bodyFor(deps, { ...fields, pool: ghost }, sponsor),
      ),
    );
    expect(error.status).toBe(404);
  });

  it('lets the sponsor update and clear the description', async () => {
    const { fields, deps } = signed();
    await saveMetadata(deps, address, bodyFor(deps, fields, sponsor));
    const cleared = { ...fields, name: 'Renamed', description: null };
    expect(
      await saveMetadata(deps, address, bodyFor(deps, cleared, sponsor)),
    ).toEqual({ name: 'Renamed', description: null });
  });
});

describe('recordTransaction', () => {
  const pool = makePool();
  const row = (
    kind: ActivityInput['kind'],
    eventIndex: number,
  ): ActivityInput => ({
    kind,
    wallet: newKey().toBase58(),
    amount: 5n,
    matchAmount: null,
    txSignature: TX,
    eventIndex,
    occurredAt: new Date(NOW * 1000),
  });

  it('creates the pool row if needed, records events, and is idempotent', async () => {
    const chain = fakeChain([pool]);
    chain.events_.set(TX, [
      {
        pool: pool.address,
        rows: [row('DEPOSITED', 0), row('MATCH_FUNDED', 1)],
      },
    ]);
    const store = memoryStore();
    const deps = makeDeps(chain, store);

    expect(await recordTransaction(deps, TX)).toEqual({
      events: 2,
      recorded: 2,
    });
    expect(store.pools.get(pool.address.toBase58())?.metadata.name).toBe(
      `Pool #${pool.poolId}`,
    );
    expect(await recordTransaction(deps, TX)).toEqual({
      events: 2,
      recorded: 0,
    });
    expect(store.activities.size).toBe(2);
  });

  it("does not overwrite a sponsor's chosen name when recording", async () => {
    const chain = fakeChain([pool]);
    chain.events_.set(TX, [{ pool: pool.address, rows: [row('CLAIMED', 0)] }]);
    const store = memoryStore();
    const deps = makeDeps(chain, store);
    await store.saveMetadata(
      {
        programId: deps.chain.programId.toBase58(),
        onchainAddress: pool.address.toBase58(),
        sponsorWallet: pool.sponsor.toBase58(),
        poolId: pool.poolId,
      },
      { name: 'Sponsor chose this', description: null },
    );
    await recordTransaction(deps, TX);
    expect(store.pools.get(pool.address.toBase58())?.metadata.name).toBe(
      'Sponsor chose this',
    );
  });

  it('ignores events for a pool that does not exist on-chain', async () => {
    const chain = fakeChain([]);
    chain.events_.set(TX, [
      { pool: pool.address, rows: [row('DEPOSITED', 0)] },
    ]);
    const store = memoryStore();
    expect(await recordTransaction(makeDeps(chain, store), TX)).toEqual({
      events: 0,
      recorded: 0,
    });
    expect(store.pools.size).toBe(0);
  });

  it('records nothing for a transaction with no program events', async () => {
    expect(
      await recordTransaction(makeDeps(fakeChain([pool]), memoryStore()), TX),
    ).toEqual({ events: 0, recorded: 0 });
  });
});

describe('listActivity', () => {
  const pool = makePool();
  const address = pool.address.toBase58();

  async function seeded(count: number) {
    const chain = fakeChain([pool]);
    const store = memoryStore();
    const deps = makeDeps(chain, store);
    await store.ensurePool({
      programId: deps.chain.programId.toBase58(),
      onchainAddress: address,
      sponsorWallet: pool.sponsor.toBase58(),
      poolId: pool.poolId,
    });
    // Several rows share one timestamp on purpose: the id must break the tie.
    const rows: ActivityInput[] = Array.from({ length: count }, (_, i) => ({
      kind: 'DEPOSITED',
      wallet: newKey().toBase58(),
      amount: BigInt(i),
      matchAmount: null,
      txSignature: `${i}`.padStart(88, '5'),
      eventIndex: 0,
      occurredAt: new Date((NOW - Math.floor(i / 3)) * 1000),
    }));
    await store.recordActivities(address, rows);
    return deps;
  }

  it('pages through every row exactly once, newest first, with stable ties', async () => {
    const deps = await seeded(11);
    const seen: string[] = [];
    let cursor: string | undefined;
    for (let guard = 0; guard < 10; guard += 1) {
      const page = await listActivity(deps, address, { limit: 4, cursor });
      seen.push(...page.items.map((item) => item.id));
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }
    expect(seen).toHaveLength(11);
    expect(new Set(seen).size).toBe(11);
  });

  it('rejects a cursor this server did not issue', async () => {
    const deps = await seeded(3);
    const error = await rejection(
      listActivity(deps, address, { limit: 4, cursor: 'garbage' }),
    );
    expect([error.status, error.code]).toEqual([400, 'invalid_cursor']);
  });

  it('is empty for a pool with no recorded activity', async () => {
    const deps = makeDeps(fakeChain([pool]), memoryStore());
    expect(await listActivity(deps, address, { limit: 4 })).toEqual({
      items: [],
      nextCursor: null,
    });
  });
});
