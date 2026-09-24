// @vitest-environment node
import { Keypair } from '@solana/web3.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FaucetDeps } from '@/lib/faucet/service';
import type { PoolServiceDeps } from '@/lib/pools/service';

const holder = vi.hoisted(() => ({
  deps: null as PoolServiceDeps | null,
  faucet: null as FaucetDeps | null,
  allow: true,
  configured: true,
}));

vi.mock('@/lib/pools/server', () => ({
  getPoolServices: () => {
    if (!holder.deps) throw new Error('test forgot to set deps');
    return holder.deps;
  },
}));
vi.mock('@/lib/faucet/server', () => ({
  getFaucetServices: () => holder.faucet,
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: { limit: () => Promise.resolve({ success: holder.allow }) },
  get rateLimitConfigured() {
    return holder.configured;
  },
}));

import { buildMetadataMessage } from '@/lib/pools/signed-message';
import {
  NOW,
  fakeChain,
  makeDeps,
  makePool,
  makePosition,
  memoryStore,
  newKey,
  signBase64,
} from '@/lib/pools/test-fakes';

import { POST as recordActivity } from './activity/route';
import { GET as getDeploymentRoute } from './deployment/route';
import { POST as faucetRoute } from './faucet/route';
import { GET as getPoolRoute } from './pools/[address]/route';
import { GET as getActivityRoute } from './pools/[address]/activity/route';
import { POST as saveMetadataRoute } from './pools/[address]/metadata/route';
import { GET as listPoolsRoute } from './pools/route';
import { GET as getPositionsRoute } from './positions/route';

const BASE = 'http://localhost:3003/api';
const sponsor = Keypair.generate();
const pool = makePool({ sponsor: sponsor.publicKey });
const address = pool.address.toBase58();
const ctx = (value: string) => ({
  params: Promise.resolve({ address: value }),
});
const json = (
  body: unknown,
  headers: Record<string, string> = { 'content-type': 'application/json' },
) => ({
  method: 'POST',
  headers,
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

async function body(response: Response): Promise<Record<string, any>> {
  return response.json();
}

beforeEach(() => {
  holder.deps = makeDeps(fakeChain([pool]), memoryStore());
  holder.faucet = null;
  holder.allow = true;
  holder.configured = true;
});
afterEach(() => vi.restoreAllMocks());

describe('GET /api/pools', () => {
  it('lists pools and allows brief public caching', async () => {
    const response = await listPoolsRoute(new Request(`${BASE}/pools`));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage=3');
    const data = await body(response);
    expect(data.total).toBe(1);
    expect(data.pools[0].address).toBe(address);
  });

  it('rejects bad query parameters with the offending field named', async () => {
    for (const query of [
      'limit=1000',
      'limit=abc',
      'sponsor=not-an-address',
      'status=hacked',
    ]) {
      const response = await listPoolsRoute(
        new Request(`${BASE}/pools?${query}`),
      );
      expect(response.status, query).toBe(400);
      const data = await body(response);
      expect(data.error.code).toBe('invalid_request');
      expect(data.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe('GET /api/pools/[address]', () => {
  it('returns the pool, and never caches a response that may carry a wallet', async () => {
    const response = await getPoolRoute(
      new Request(`${BASE}/pools/${address}`),
      ctx(address),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await body(response)).pool.address).toBe(address);
  });

  it("includes the wallet's position, with vesting as of now", async () => {
    const position = makePosition(pool, { startedAt: NOW - 250 });
    holder.deps = makeDeps(fakeChain([pool], [position]), memoryStore());
    const response = await getPoolRoute(
      new Request(
        `${BASE}/pools/${address}?wallet=${position.saver.toBase58()}`,
      ),
      ctx(address),
    );
    expect((await body(response)).position.claimable).toBe(
      (25n * 10n ** 8n).toString(),
    );
  });

  it('is 400 for a malformed address and 404 for an unknown one', async () => {
    expect(
      (await getPoolRoute(new Request(`${BASE}/pools/nope`), ctx('nope')))
        .status,
    ).toBe(400);
    expect(
      (
        await getPoolRoute(
          new Request(`${BASE}/pools/x?wallet=bad`),
          ctx(address),
        )
      ).status,
    ).toBe(400);
    const unknown = newKey().toBase58();
    const missing = await getPoolRoute(
      new Request(`${BASE}/pools/${unknown}`),
      ctx(unknown),
    );
    expect(missing.status).toBe(404);
    expect((await body(missing)).error.code).toBe('pool_not_found');
  });
});

describe('GET /api/pools/[address]/activity', () => {
  it('returns an empty page and rejects a cursor it did not issue', async () => {
    const empty = await getActivityRoute(
      new Request(`${BASE}/pools/${address}/activity`),
      ctx(address),
    );
    expect(await body(empty)).toEqual({ items: [], nextCursor: null });
    const bad = await getActivityRoute(
      new Request(`${BASE}/pools/${address}/activity?cursor=garbage`),
      ctx(address),
    );
    expect(bad.status).toBe(400);
    expect((await body(bad)).error.code).toBe('invalid_cursor');
    expect(
      (
        await getActivityRoute(
          new Request(`${BASE}/pools/${address}/activity?limit=999`),
          ctx(address),
        )
      ).status,
    ).toBe(400);
  });
});

describe('POST /api/pools/[address]/metadata', () => {
  function signedBody(
    overrides: Record<string, unknown> = {},
    signer: Keypair = sponsor,
  ) {
    const fields = {
      name: 'Contractor match',
      description: 'For contributors',
      issuedAt: NOW,
      ...overrides,
    };
    const message = buildMetadataMessage({
      programId: holder.deps!.chain.programId.toBase58(),
      pool: address,
      name: String(fields.name),
      description:
        fields.description === '' ? null : String(fields.description),
      issuedAt: Number(fields.issuedAt),
    });
    return { ...fields, signature: signBase64(signer, message) };
  }

  it("saves when the sponsor's signature is valid", async () => {
    const response = await saveMetadataRoute(
      new Request(`${BASE}/pools/${address}/metadata`, json(signedBody())),
      ctx(address),
    );
    expect(response.status).toBe(200);
    expect(await body(response)).toEqual({
      name: 'Contractor match',
      description: 'For contributors',
    });
  });

  it('is 401 for a signature from another wallet or over other text', async () => {
    const other = await saveMetadataRoute(
      new Request(
        `${BASE}/pools/${address}/metadata`,
        json(signedBody({}, Keypair.generate())),
      ),
      ctx(address),
    );
    expect(other.status).toBe(401);
    const tampered = { ...signedBody(), name: 'Somebody else' };
    const changed = await saveMetadataRoute(
      new Request(`${BASE}/pools/${address}/metadata`, json(tampered)),
      ctx(address),
    );
    expect((await body(changed)).error.code).toBe('invalid_signature');
  });

  it('rejects the wrong content type, oversized and malformed bodies', async () => {
    const url = `${BASE}/pools/${address}/metadata`;
    expect(
      (
        await saveMetadataRoute(
          new Request(url, json('x', { 'content-type': 'text/plain' })),
          ctx(address),
        )
      ).status,
    ).toBe(415);
    // A form a browser may post cross-site without a preflight, dressed up to look like JSON.
    expect(
      (
        await saveMetadataRoute(
          new Request(
            url,
            json(signedBody(), {
              'content-type': 'text/plain;application/json',
            }),
          ),
          ctx(address),
        )
      ).status,
    ).toBe(415);
    expect(
      (
        await saveMetadataRoute(
          new Request(
            url,
            json(signedBody(), {
              'content-type': 'Application/JSON; charset=utf-8',
            }),
          ),
          ctx(address),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await saveMetadataRoute(
          new Request(url, json('x'.repeat(9_000))),
          ctx(address),
        )
      ).status,
    ).toBe(413);
    expect(
      (
        await saveMetadataRoute(
          new Request(url, json('{not json')),
          ctx(address),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await saveMetadataRoute(
          new Request(url, json({ ...signedBody(), extra: 'field' })),
          ctx(address),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await saveMetadataRoute(
          new Request(url, json({ ...signedBody(), name: 'x'.repeat(81) })),
          ctx(address),
        )
      ).status,
    ).toBe(400);
  });
});

describe('GET /api/positions', () => {
  it('needs a valid wallet', async () => {
    expect(
      (await getPositionsRoute(new Request(`${BASE}/positions`))).status,
    ).toBe(400);
    expect(
      (await getPositionsRoute(new Request(`${BASE}/positions?wallet=nope`)))
        .status,
    ).toBe(400);
  });

  it("returns that wallet's positions, uncached", async () => {
    const position = makePosition(pool);
    holder.deps = makeDeps(fakeChain([pool], [position]), memoryStore());
    const response = await getPositionsRoute(
      new Request(`${BASE}/positions?wallet=${position.saver.toBase58()}`),
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await body(response)).positions).toHaveLength(1);
  });
});

describe('POST /api/activity', () => {
  it('validates the signature format and records what the chain shows', async () => {
    for (const bad of [
      {},
      { signature: 'nope' },
      { signature: '5'.repeat(88), extra: 1 },
    ]) {
      expect(
        (await recordActivity(new Request(`${BASE}/activity`, json(bad))))
          .status,
      ).toBe(400);
    }
    const ok = await recordActivity(
      new Request(`${BASE}/activity`, json({ signature: '5'.repeat(88) })),
    );
    expect(ok.status).toBe(200);
    expect(await body(ok)).toEqual({ events: 0, recorded: 0 });
  });
});

describe('GET /api/deployment', () => {
  it('describes the deployment', async () => {
    const response = await getDeploymentRoute(
      new Request(`${BASE}/deployment`),
    );
    expect(response.status).toBe(200);
    const data = await body(response);
    expect(data.network).toBe('localnet');
    expect(data.faucet).toBeNull();
  });

  it('advertises the faucet terms, and nothing secret, when the deployment runs one', async () => {
    holder.deps = {
      ...holder.deps!,
      faucet: { tokens: '100', sol: '0.02' },
    };
    const response = await getDeploymentRoute(
      new Request(`${BASE}/deployment`),
    );
    expect((await body(response)).faucet).toEqual({
      tokens: '100',
      sol: '0.02',
    });
  });
});

describe('POST /api/faucet', () => {
  const faucetKey = Keypair.generate().publicKey;
  const sent: string[] = [];
  const allow = { limit: () => Promise.resolve({ success: true }) };
  const fakeFaucet = (): FaucetDeps => ({
    faucet: faucetKey,
    chain: {
      mint: () => Promise.resolve({ decimals: 8, multiplier: '1' }),
      tokenBalance: (owner) =>
        Promise.resolve(owner.equals(faucetKey) ? 10n ** 15n : 0n),
      lamports: (owner) =>
        Promise.resolve(owner.equals(faucetKey) ? 10n ** 10n : 0n),
      send: ({ recipient }) => {
        sent.push(recipient.toBase58());
        return Promise.resolve('5sig');
      },
    },
    limiters: { wallet: allow, ip: allow, global: allow },
  });
  const request = (payload: unknown, headers?: Record<string, string>) =>
    faucetRoute(new Request(`${BASE}/faucet`, json(payload, headers)));

  beforeEach(() => {
    sent.length = 0;
    holder.faucet = fakeFaucet();
  });

  it('sends demo tokens and SOL to a wallet and never caches the answer', async () => {
    const wallet = newKey().toBase58();
    const response = await request({ wallet });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await body(response)).toEqual({
      signature: '5sig',
      tokensRaw: '10000000000',
      lamports: '20000000',
    });
    expect(sent).toEqual([wallet]);
  });

  it('answers 404 on a deployment without a faucet', async () => {
    holder.faucet = null;
    const response = await request({ wallet: newKey().toBase58() });
    expect(response.status).toBe(404);
    expect((await body(response)).error.code).toBe('faucet_unavailable');
  });

  it.each([
    ['a missing wallet', {}],
    ['a malformed wallet', { wallet: 'not-a-wallet' }],
    ['unknown fields', { wallet: 'x', amount: 1_000_000 }],
  ])('rejects %s', async (_label, payload) => {
    const response = await request(payload);
    expect(response.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it('rejects a body that is not JSON', async () => {
    const response = await request('wallet=abc', {
      'content-type': 'application/x-www-form-urlencoded',
    });
    expect(response.status).toBe(415);
  });

  it('is behind the general rate limit too', async () => {
    holder.allow = false;
    const response = await request({ wallet: newKey().toBase58() });
    expect(response.status).toBe(429);
    expect(sent).toHaveLength(0);
  });
});

describe('protection', () => {
  it('answers 429 with Retry-After and does no work when rate limited', async () => {
    holder.allow = false;
    const spy = vi.spyOn(holder.deps!.chain, 'pools');
    const response = await listPoolsRoute(new Request(`${BASE}/pools`));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('10');
    expect((await body(response)).error.code).toBe('rate_limited');
    expect(spy).not.toHaveBeenCalled();
  });

  it('names a missing rate limiter as a misconfiguration and still refuses to serve', async () => {
    holder.configured = false;
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const spy = vi.spyOn(holder.deps!.chain, 'pools');
    const response = await listPoolsRoute(new Request(`${BASE}/pools`));
    expect(response.status).toBe(503);
    expect((await body(response)).error.code).toBe('rate_limiter_unavailable');
    expect(spy).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('UPSTASH_REDIS_REST_URL'),
    );
  });

  it('hides internal errors: the caller gets a generic 500, the log gets the detail', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(holder.deps!.chain, 'pools').mockRejectedValue(
      new Error(
        'connect ECONNREFUSED https://mainnet.helius-rpc.com/?api-key=SECRET123',
      ),
    );
    const response = await listPoolsRoute(new Request(`${BASE}/pools`));
    expect(response.status).toBe(500);
    const text = JSON.stringify(await body(response));
    expect(text).toContain('internal_error');
    expect(text).not.toContain('SECRET123');
    expect(text).not.toContain('helius');
    expect(log).toHaveBeenCalled();
  });
});
