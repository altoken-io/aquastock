// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  key: undefined as string | undefined,
  hermes: undefined as string | undefined,
}));

vi.mock('@/lib/env/server', () => ({
  optionalServerEnv: (name: string) =>
    name === 'PYTH_API_KEY' ? holder.key : holder.hermes,
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: { limit: () => Promise.resolve({ success: true }) },
  rateLimitConfigured: true,
}));
vi.mock('@/lib/price/pyth', () => ({
  hermesBaseUrl: (value: string | undefined) => value ?? 'default-host',
  fetchSpyxPrice: vi.fn(
    (key: string, _now: number, _fetch: unknown, baseUrl: string) =>
      Promise.resolve({
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

import { GET } from './route';

afterEach(() => {
  holder.key = undefined;
  holder.hermes = undefined;
});

describe('GET /api/price', () => {
  it('answers 404 when the deployment has no Pyth key', async () => {
    const response = await GET(new Request('http://localhost/api/price'));
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe('price_unavailable');
  });

  it('serves the price with brief public caching, using the server key', async () => {
    holder.key = 'KEY';
    const response = await GET(new Request('http://localhost/api/price'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage');
    const body = await response.json();
    expect(body.price).toBe('612.3456');
    expect(body.usedKey).toBe(true);
    expect(body.usedHost).toBe('default-host');
    expect(JSON.stringify(body)).not.toContain('"KEY"');
  });

  it('asks the Hermes host PYTH_HERMES_URL names', async () => {
    holder.key = 'KEY';
    holder.hermes = 'https://hermes.pyth.network';
    const body = await (
      await GET(new Request('http://localhost/api/price'))
    ).json();
    expect(body.usedHost).toBe('https://hermes.pyth.network');
  });
});
