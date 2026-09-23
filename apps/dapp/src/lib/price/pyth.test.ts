// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/errors';
import {
  MAX_PRICE_AGE_SECONDS,
  SPYX_USD_FEED_ID,
  fetchSpyxPrice,
  toDecimal,
} from './pyth';

const NOW = 1_790_200_000;

function hermes(
  price: Partial<{
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  }> = {},
  id = SPYX_USD_FEED_ID,
): unknown {
  return {
    binary: { encoding: 'hex', data: ['00'] },
    parsed: [
      {
        id,
        price: {
          price: '61234560000',
          conf: '4500000',
          expo: -8,
          publish_time: NOW - 5,
          ...price,
        },
        ema_price: {},
        metadata: {},
      },
    ],
  };
}

function fakeFetch(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
}

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  if (!(error instanceof ApiError)) throw new Error('expected an ApiError');
  return error;
}

afterEach(() => vi.restoreAllMocks());

describe('toDecimal', () => {
  it('turns Pyth fixed point into an exact decimal', () => {
    expect(toDecimal(61_234_560_000n, -8)).toBe('612.3456');
    expect(toDecimal(5n, -8)).toBe('0.00000005');
    expect(toDecimal(100_000_000n, -8)).toBe('1');
    expect(toDecimal(12n, 2)).toBe('1200');
    expect(toDecimal(-150n, -2)).toBe('-1.5');
  });
});

describe('fetchSpyxPrice', () => {
  it('reads SPYx/USD with the key as a Bearer token', async () => {
    const fetchImpl = fakeFetch(hermes());
    const price = await fetchSpyxPrice('KEY123', NOW, fetchImpl);
    expect(price).toEqual({
      pair: 'SPYx/USD',
      feedId: SPYX_USD_FEED_ID,
      price: '612.3456',
      confidence: '0.045',
      publishTime: NOW - 5,
    });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toContain(SPYX_USD_FEED_ID);
    expect(new Headers(init?.headers).get('authorization')).toBe(
      'Bearer KEY123',
    );
  });

  it('accepts the feed id with a 0x prefix', async () => {
    const price = await fetchSpyxPrice(
      'k',
      NOW,
      fakeFetch(hermes({}, `0x${SPYX_USD_FEED_ID}`)),
    );
    expect(price.price).toBe('612.3456');
  });

  it('treats a rejected key as unavailable and never logs the key', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = await rejection(
      fetchSpyxPrice('SECRET-KEY', NOW, fakeFetch('unauthorized', 401)),
    );
    expect(error.status).toBe(503);
    expect(error.code).toBe('price_unavailable');
    expect(JSON.stringify(log.mock.calls)).not.toContain('SECRET-KEY');
  });

  it('treats a network failure as unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.reject(new TypeError('fetch failed')),
    );
    expect((await rejection(fetchSpyxPrice('k', NOW, fetchImpl))).code).toBe(
      'price_unavailable',
    );
  });

  it.each([
    ['a different feed only', hermes({}, 'ab'.repeat(32))],
    ['an empty list', { parsed: [] }],
    ['a price that is not an integer', hermes({ price: '12.5' })],
    ['no parsed field', { binary: {} }],
    ['not an object', 'nope'],
  ])('refuses %s', async (_label, body) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(
      (await rejection(fetchSpyxPrice('k', NOW, fakeFetch(body)))).code,
    ).toBe('price_unavailable');
  });

  it('refuses a zero or negative price', async () => {
    for (const value of ['0', '-5']) {
      const error = await rejection(
        fetchSpyxPrice('k', NOW, fakeFetch(hermes({ price: value }))),
      );
      expect(error.code).toBe('price_unavailable');
    }
  });

  it('refuses a stale price, but keeps one at the age limit', async () => {
    const stale = hermes({ publish_time: NOW - MAX_PRICE_AGE_SECONDS - 1 });
    expect(
      (await rejection(fetchSpyxPrice('k', NOW, fakeFetch(stale)))).code,
    ).toBe('price_unavailable');
    const edge = hermes({ publish_time: NOW - MAX_PRICE_AGE_SECONDS });
    await expect(
      fetchSpyxPrice('k', NOW, fakeFetch(edge)),
    ).resolves.toBeTruthy();
  });
});
