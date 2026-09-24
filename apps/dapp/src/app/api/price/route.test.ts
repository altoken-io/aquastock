// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';

const holder = vi.hoisted(() => ({
  key: undefined as string | undefined,
  hermes: undefined as string | undefined,
  pyth: 'ok' as 'ok' | 'down' | 'refused',
  jupiterFails: false,
  coingeckoFails: false,
  multiplier: '1.005714560286254' as string | null,
}));

vi.mock('@/lib/env/server', () => ({
  optionalServerEnv: (name: string) =>
    name === 'PYTH_API_KEY' ? holder.key : holder.hermes,
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: { limit: () => Promise.resolve({ success: true }) },
  rateLimitConfigured: true,
}));
// The multiplier CoinGecko's fallback needs comes from the deployment's live mint.
vi.mock('@/lib/pools/server', () => ({ getPoolServices: () => ({}) }));
vi.mock('@/lib/pools/service', () => ({
  getDeployment: () =>
    Promise.resolve({
      issuer:
        holder.multiplier === null ? null : { multiplier: holder.multiplier },
    }),
}));

const unavailable = () =>
  new ApiError(503, 'price_unavailable', 'the market price is not available');

vi.mock('@/lib/price/pyth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/price/pyth')>();
  return {
    ...actual,
    hermesBaseUrl: (value: string | undefined) => value ?? 'default-host',
    fetchSpyxPrice: vi.fn(
      (key: string, _now: number, _fetch: unknown, baseUrl: string) =>
        holder.pyth === 'refused'
          ? Promise.reject(new actual.PythRefusedError(403))
          : holder.pyth === 'down'
            ? Promise.reject(unavailable())
            : Promise.resolve({
                source: 'pyth',
                pair: 'SPYx/USD',
                feedId: 'feed',
                price: '612.3456',
                confidence: '0.045',
                publishTime: 1,
                reference: null,
                usedKey: key === 'KEY',
                usedHost: baseUrl,
              }),
    ),
  };
});
vi.mock('@/lib/price/jupiter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/price/jupiter')>()),
  fetchJupiterSpyxPrice: vi.fn(() =>
    holder.jupiterFails
      ? Promise.reject(unavailable())
      : Promise.resolve({
          source: 'jupiter',
          pair: 'SPYx/USD',
          feedId: 'mint',
          price: '765.78',
          confidence: null,
          publishTime: 2,
          reference: {
            symbol: 'SPY',
            price: '766.19',
            source: 'xstocks',
            updatedAt: 1,
          },
        }),
  ),
}));
vi.mock('@/lib/price/coingecko', () => ({
  fetchCoinGeckoSpyxPrice: vi.fn((multiplier: string) =>
    holder.coingeckoFails
      ? Promise.reject(unavailable())
      : Promise.resolve({
          source: 'coingecko',
          pair: 'SPYx/USD',
          feedId: 'mint',
          price: '765.77',
          confidence: null,
          publishTime: 3,
          reference: null,
          usedMultiplier: multiplier,
        }),
  ),
}));

import { fetchSpyxPrice } from '@/lib/price/pyth';

import { GET } from './route';

afterEach(() => {
  holder.key = undefined;
  holder.hermes = undefined;
  holder.pyth = 'ok';
  holder.jupiterFails = false;
  holder.coingeckoFails = false;
  holder.multiplier = '1.005714560286254';
  vi.useRealTimers();
  vi.clearAllMocks();
});

const get = () => GET(new Request('http://localhost/api/price'));

describe('GET /api/price', () => {
  it('serves Pyth with brief public caching, using the server key', async () => {
    holder.key = 'KEY';
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage');
    const body = await response.json();
    expect(body.source).toBe('pyth');
    expect(body.price).toBe('612.3456');
    expect(body.usedKey).toBe(true);
    expect(body.usedHost).toBe('default-host');
    expect(JSON.stringify(body)).not.toContain('"KEY"');
  });

  it('asks the Hermes host PYTH_HERMES_URL names', async () => {
    holder.key = 'KEY';
    holder.hermes = 'https://hermes.pyth.network';
    const body = await (await get()).json();
    expect(body.usedHost).toBe('https://hermes.pyth.network');
  });

  it('serves Jupiter, with the SPY reference, when the deployment has no Pyth key', async () => {
    const response = await get();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe('jupiter');
    expect(body.price).toBe('765.78');
    expect(body.reference).toEqual({
      symbol: 'SPY',
      price: '766.19',
      source: 'xstocks',
      updatedAt: 1,
    });
  });

  it('falls back to Jupiter while Pyth is down', async () => {
    holder.key = 'KEY';
    holder.pyth = 'down';
    const body = await (await get()).json();
    expect(body.source).toBe('jupiter');
  });

  it('remembers a refused key between requests instead of asking Pyth every time', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // A fixed moment long past, so the hold this sets has lapsed for every other test.
    vi.useFakeTimers({
      now: new Date('2020-01-01T00:00:00Z'),
      toFake: ['Date'],
    });
    holder.key = 'KEY';
    holder.pyth = 'refused';
    expect((await (await get()).json()).source).toBe('jupiter');
    expect((await (await get()).json()).source).toBe('jupiter');
    expect(vi.mocked(fetchSpyxPrice)).toHaveBeenCalledTimes(1);
  });

  it('falls back to CoinGecko, converted by the mint multiplier, when Jupiter is down', async () => {
    holder.jupiterFails = true;
    const body = await (await get()).json();
    expect(body.source).toBe('coingecko');
    expect(body.usedMultiplier).toBe('1.005714560286254');
  });

  it('answers 503 rather than an unconverted price when the multiplier is unknown', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    holder.jupiterFails = true;
    holder.multiplier = null;
    const response = await get();
    expect(response.status).toBe(503);
  });

  it('answers 503 when no source has a price', async () => {
    holder.key = 'KEY';
    holder.pyth = 'down';
    holder.jupiterFails = true;
    holder.coingeckoFails = true;
    const response = await get();
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe('price_unavailable');
  });
});
