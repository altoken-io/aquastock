// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';

const holder = vi.hoisted(() => ({
  key: undefined as string | undefined,
  hermes: undefined as string | undefined,
  pythFails: false,
  jupiterFails: false,
}));

vi.mock('@/lib/env/server', () => ({
  optionalServerEnv: (name: string) =>
    name === 'PYTH_API_KEY' ? holder.key : holder.hermes,
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: { limit: () => Promise.resolve({ success: true }) },
  rateLimitConfigured: true,
}));

const unavailable = () =>
  new ApiError(503, 'price_unavailable', 'the market price is not available');

vi.mock('@/lib/price/pyth', () => ({
  hermesBaseUrl: (value: string | undefined) => value ?? 'default-host',
  fetchSpyxPrice: vi.fn(
    (key: string, _now: number, _fetch: unknown, baseUrl: string) =>
      holder.pythFails
        ? Promise.reject(unavailable())
        : Promise.resolve({
            source: 'pyth',
            pair: 'SPYx/USD',
            feedId: 'feed',
            price: '612.3456',
            confidence: '0.045',
            publishTime: 1,
            usedKey: key === 'KEY',
            usedHost: baseUrl,
          }),
  ),
}));
vi.mock('@/lib/price/jupiter', () => ({
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
        }),
  ),
}));

import { GET } from './route';

afterEach(() => {
  holder.key = undefined;
  holder.hermes = undefined;
  holder.pythFails = false;
  holder.jupiterFails = false;
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

  it('falls back to Jupiter when the deployment has no Pyth key', async () => {
    const response = await get();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe('jupiter');
    expect(body.price).toBe('765.78');
  });

  it('falls back to Jupiter when Pyth refuses the key', async () => {
    holder.key = 'KEY';
    holder.pythFails = true;
    const body = await (await get()).json();
    expect(body.source).toBe('jupiter');
  });

  it('answers 503 when neither source has a price', async () => {
    holder.key = 'KEY';
    holder.pythFails = true;
    holder.jupiterFails = true;
    const response = await get();
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe('price_unavailable');
  });
});
