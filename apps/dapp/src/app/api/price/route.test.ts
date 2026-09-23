// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({ key: undefined as string | undefined }));

vi.mock('@/lib/env/server', () => ({
  optionalServerEnv: () => holder.key,
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: { limit: () => Promise.resolve({ success: true }) },
  rateLimitConfigured: true,
}));
vi.mock('@/lib/price/pyth', () => ({
  fetchSpyxPrice: vi.fn((key: string) =>
    Promise.resolve({
      pair: 'SPYx/USD',
      feedId: 'feed',
      price: '612.3456',
      confidence: '0.045',
      publishTime: 1,
      usedKey: key === 'KEY',
    }),
  ),
}));

import { GET } from './route';

afterEach(() => {
  holder.key = undefined;
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
    expect(JSON.stringify(body)).not.toContain('"KEY"');
  });
});
