// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/errors';
import {
  SPYX_MAINNET_MINT,
  fetchJupiterSpyxPrice,
  numberToDecimal,
} from './jupiter';

const NOW = 1_790_200_000;

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

// The shape api.jup.ag/price/v3 answers, trimmed to what matters.
const jupiter = (usdPrice: unknown) => ({
  [SPYX_MAINNET_MINT]: { usdPrice, decimals: 8, blockId: 449943909 },
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

describe('numberToDecimal', () => {
  it('writes a plain decimal, at most six places, no trailing zeros', () => {
    expect(numberToDecimal(765.7802482642066)).toBe('765.780248');
    expect(numberToDecimal(765)).toBe('765');
    expect(numberToDecimal(100.5)).toBe('100.5');
    expect(numberToDecimal(0.000123)).toBe('0.000123');
  });
});

describe('fetchJupiterSpyxPrice', () => {
  it('reads the real SPYx mint, keyless, and says the price came from Jupiter', async () => {
    const fetchImpl = fakeFetch(jupiter(765.7802482642066));
    expect(await fetchJupiterSpyxPrice(NOW, fetchImpl)).toEqual({
      source: 'jupiter',
      pair: 'SPYx/USD',
      feedId: SPYX_MAINNET_MINT,
      price: '765.780248',
      confidence: null,
      publishTime: NOW,
    });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toBe(
      `https://api.jup.ag/price/v3?ids=${SPYX_MAINNET_MINT}`,
    );
    expect(new Headers(init?.headers).get('authorization')).toBeNull();
  });

  it.each([
    ['a mint Jupiter cannot price', { [SPYX_MAINNET_MINT]: null }],
    ['an empty answer', {}],
    ['a zero price', jupiter(0)],
    ['a negative price', jupiter(-5)],
    ['an absurd price', jupiter(5_000_000)],
    ['a price that is not a number', jupiter('765')],
    ['not an object', 'nope'],
  ])('refuses %s', async (_label, body) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(
      (await rejection(fetchJupiterSpyxPrice(NOW, fakeFetch(body)))).code,
    ).toBe('price_unavailable');
  });

  it('treats a refusal or an outage as unavailable, and logs why', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const limited = await rejection(
      fetchJupiterSpyxPrice(NOW, fakeFetch('Too Many Requests', 429)),
    );
    expect(limited.status).toBe(503);
    expect(log).toHaveBeenCalledWith(
      'jupiter price answered',
      429,
      'Too Many Requests',
    );
    const down = vi.fn<typeof fetch>(() =>
      Promise.reject(new TypeError('fetch failed')),
    );
    expect((await rejection(fetchJupiterSpyxPrice(NOW, down))).code).toBe(
      'price_unavailable',
    );
  });
});
