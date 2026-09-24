// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PriceDto, PriceSource } from '@aquastock/types';

import { ApiError } from '../api/errors';
import { PythRefusedError } from './pyth';
import {
  PYTH_REFUSAL_HOLD_SECONDS,
  createMarketPrice,
  type MarketPriceDeps,
} from './source';

const NOW = 1_790_200_000;

const priced = (source: PriceSource): PriceDto => ({
  source,
  pair: 'SPYx/USD',
  feedId: 'id',
  price: '765',
  confidence: null,
  publishTime: NOW,
  reference: null,
});

const unavailable = () =>
  new ApiError(503, 'price_unavailable', 'not available');

type Outcome = 'ok' | 'refused' | 'down';

function setup(options: {
  key?: string;
  pyth?: Outcome;
  jupiter?: Outcome;
  coingecko?: Outcome;
  multiplier?: string | null | Error;
}) {
  const outcome = (name: PriceSource, value: Outcome = 'ok') =>
    value === 'ok'
      ? Promise.resolve(priced(name))
      : Promise.reject(
          value === 'refused' ? new PythRefusedError(403) : unavailable(),
        );
  const sources = {
    pyth: vi.fn(() => outcome('pyth', options.pyth)),
    jupiter: vi.fn(() => outcome('jupiter', options.jupiter)),
    coingecko: vi.fn((_multiplier: string) =>
      outcome('coingecko', options.coingecko),
    ),
  };
  const multiplier = vi.fn(() =>
    options.multiplier instanceof Error
      ? Promise.reject(options.multiplier)
      : Promise.resolve(
          options.multiplier === undefined ? '1.0057' : options.multiplier,
        ),
  );
  const deps: MarketPriceDeps = {
    pythKey: () => options.key,
    hermesUrl: () => 'https://hermes.example',
    multiplier,
    sources,
  };
  return { marketPrice: createMarketPrice(deps), sources, multiplier };
}

async function code(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  return error instanceof ApiError ? error.code : error;
}

afterEach(() => vi.restoreAllMocks());

describe('createMarketPrice', () => {
  it('serves Pyth when the key may read SPYx', async () => {
    const { marketPrice, sources } = setup({ key: 'KEY' });
    expect((await marketPrice(NOW)).source).toBe('pyth');
    expect(sources.pyth).toHaveBeenCalledWith(
      'KEY',
      NOW,
      fetch,
      'https://hermes.example',
    );
    expect(sources.jupiter).not.toHaveBeenCalled();
  });

  it('goes straight to Jupiter without a Pyth key', async () => {
    const { marketPrice, sources } = setup({});
    expect((await marketPrice(NOW)).source).toBe('jupiter');
    expect(sources.pyth).not.toHaveBeenCalled();
  });

  it('stops asking Pyth for a while after it refuses the key, then asks again', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { marketPrice, sources } = setup({ key: 'KEY', pyth: 'refused' });

    expect((await marketPrice(NOW)).source).toBe('jupiter');
    expect((await marketPrice(NOW + 60)).source).toBe('jupiter');
    expect(
      (await marketPrice(NOW + PYTH_REFUSAL_HOLD_SECONDS - 1)).source,
    ).toBe('jupiter');
    expect(sources.pyth).toHaveBeenCalledTimes(1);

    // Once the hold is over, Pyth is first in line again.
    await marketPrice(NOW + PYTH_REFUSAL_HOLD_SECONDS);
    expect(sources.pyth).toHaveBeenCalledTimes(2);
  });

  it('keeps asking Pyth after an outage, which may pass any moment', async () => {
    const { marketPrice, sources } = setup({ key: 'KEY', pyth: 'down' });
    await marketPrice(NOW);
    await marketPrice(NOW + 1);
    expect(sources.pyth).toHaveBeenCalledTimes(2);
    expect(sources.jupiter).toHaveBeenCalledTimes(2);
  });

  it('falls back to CoinGecko with the mint multiplier when Jupiter is down', async () => {
    const { marketPrice, sources, multiplier } = setup({
      jupiter: 'down',
      multiplier: '1.005714560286254',
    });
    expect((await marketPrice(NOW)).source).toBe('coingecko');
    expect(multiplier).toHaveBeenCalledTimes(1);
    expect(sources.coingecko).toHaveBeenCalledWith('1.005714560286254', NOW);
  });

  it('never reads the multiplier while Jupiter answers', async () => {
    const { marketPrice, multiplier } = setup({});
    await marketPrice(NOW);
    expect(multiplier).not.toHaveBeenCalled();
  });

  it('shows no price rather than an unconverted one when the multiplier is unknown', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    for (const value of [null, new Error('rpc down')]) {
      const { marketPrice, sources } = setup({
        jupiter: 'down',
        multiplier: value,
      });
      expect(await code(marketPrice(NOW))).toBe('price_unavailable');
      expect(sources.coingecko).not.toHaveBeenCalled();
    }
  });

  it('answers unavailable when no source has a price', async () => {
    const { marketPrice } = setup({
      key: 'KEY',
      pyth: 'down',
      jupiter: 'down',
      coingecko: 'down',
    });
    expect(await code(marketPrice(NOW))).toBe('price_unavailable');
  });

  it('lets a bug surface instead of hiding it behind a fallback', async () => {
    const { marketPrice, sources } = setup({});
    sources.jupiter.mockImplementation(() =>
      Promise.reject(new TypeError('boom')),
    );
    const error = await marketPrice(NOW).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TypeError);
  });
});
