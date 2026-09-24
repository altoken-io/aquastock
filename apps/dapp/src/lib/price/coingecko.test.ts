// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/errors';
import {
  MAX_COINGECKO_AGE_SECONDS,
  fetchCoinGeckoSpyxPrice,
} from './coingecko';
import { SPYX_MAINNET_MINT } from './jupiter';

const NOW = 1_790_200_000;
const MULTIPLIER = '1.005714560286254';

function fakeFetch(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve(
      new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
}

// The shape /simple/token_price/solana answers.
const coingecko = (usd: unknown, lastUpdatedAt: unknown = NOW - 60) => ({
  [SPYX_MAINNET_MINT]: { usd, last_updated_at: lastUpdatedAt },
});

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  if (!(error instanceof ApiError)) throw new Error('expected an ApiError');
  return error;
}

afterEach(() => vi.restoreAllMocks());

describe('fetchCoinGeckoSpyxPrice', () => {
  it('turns its raw-token price into a price per token as a wallet shows it', async () => {
    // 2026-09-24: CoinGecko $770.15 while SPY was $766.19 and Jupiter $765.63. Divided by the
    // mint's multiplier it lands next to them.
    const fetchImpl = fakeFetch(coingecko(770.15));
    const price = await fetchCoinGeckoSpyxPrice(MULTIPLIER, NOW, fetchImpl);
    expect(price).toEqual({
      source: 'coingecko',
      pair: 'SPYx/USD',
      feedId: SPYX_MAINNET_MINT,
      price: '765.773939',
      confidence: null,
      publishTime: NOW - 60,
      reference: null,
    });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toContain(`contract_addresses=${SPYX_MAINNET_MINT}`);
    expect(new Headers(init?.headers).get('authorization')).toBeNull();
  });

  it('finds the mint when CoinGecko lower-cases the address', async () => {
    const body = {
      [SPYX_MAINNET_MINT.toLowerCase()]: {
        usd: 603.43,
        last_updated_at: NOW,
      },
    };
    const price = await fetchCoinGeckoSpyxPrice('1', NOW, fakeFetch(body));
    expect(price.price).toBe('603.43');
  });

  it.each(['0', '-1', 'abc', ''])(
    'asks nothing without a usable multiplier (%j)',
    async (multiplier) => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const fetchImpl = fakeFetch(coingecko(770.15));
      expect(
        (await rejection(fetchCoinGeckoSpyxPrice(multiplier, NOW, fetchImpl)))
          .code,
      ).toBe('price_unavailable');
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['an empty answer', {}],
    ['a zero price', coingecko(0)],
    ['an absurd price', coingecko(5_000_000)],
    ['a price that is not a number', coingecko('770')],
    ['a stale price', coingecko(770.15, NOW - MAX_COINGECKO_AGE_SECONDS - 1)],
    ['a future-dated price', coingecko(770.15, NOW + 120)],
    ['not an object', 'nope'],
  ])('refuses %s', async (_label, body) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(
      (
        await rejection(
          fetchCoinGeckoSpyxPrice(MULTIPLIER, NOW, fakeFetch(body)),
        )
      ).code,
    ).toBe('price_unavailable');
  });

  it('treats rate limiting or an outage as unavailable, and logs why', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const limited = await rejection(
      fetchCoinGeckoSpyxPrice(MULTIPLIER, NOW, fakeFetch('Throttled', 429)),
    );
    expect(limited.status).toBe(503);
    expect(log).toHaveBeenCalledWith(
      'coingecko price answered',
      429,
      'Throttled',
    );
    const down = vi.fn<typeof fetch>(() =>
      Promise.reject(new TypeError('fetch failed')),
    );
    expect(
      (await rejection(fetchCoinGeckoSpyxPrice(MULTIPLIER, NOW, down))).code,
    ).toBe('price_unavailable');
  });
});
