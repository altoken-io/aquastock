// Which price source answers, and in what order. Pyth first when the deployment has a key it
// accepts; Jupiter's public price otherwise; CoinGecko's only when Jupiter is down too.
//
// A key Pyth refuses (401, or 403 for a plan without the SPYx grant) is refused again a minute
// later, so after a refusal Pyth is skipped for a while instead of costing every request a round
// trip and a log line. When the key gains access, Pyth answers again within one hold period.
import type { PriceDto } from '@aquastock/types';

import { ApiError } from '../api/errors';
import { fetchCoinGeckoSpyxPrice } from './coingecko';
import { fetchJupiterSpyxPrice } from './jupiter';
import { PythRefusedError, fetchSpyxPrice } from './pyth';

/** How long Pyth is skipped after it refuses the key. */
export const PYTH_REFUSAL_HOLD_SECONDS = 30 * 60;

export interface MarketPriceDeps {
  /** The server-side Pyth key, if the deployment has one. */
  pythKey: () => string | undefined;
  /** The Hermes base URL to ask. */
  hermesUrl: () => string;
  /** The mint's current scaled-UI multiplier, for CoinGecko's raw-token price; null if unknown. */
  multiplier: () => Promise<string | null>;
  sources?: {
    pyth: typeof fetchSpyxPrice;
    jupiter: typeof fetchJupiterSpyxPrice;
    coingecko: typeof fetchCoinGeckoSpyxPrice;
  };
}

const unavailable = () =>
  new ApiError(
    503,
    'price_unavailable',
    'the market price is not available right now',
  );

/** Only `price_unavailable` means "try the next source"; anything else is a bug and stays loud. */
const isUnavailable = (error: unknown): boolean =>
  error instanceof ApiError && error.code === 'price_unavailable';

/**
 * A price reader with its own memory of Pyth refusals. The hold lives in the server instance, so
 * a cold start asks Pyth once more; that is the whole cost.
 */
export function createMarketPrice(deps: MarketPriceDeps) {
  const sources = deps.sources ?? {
    pyth: fetchSpyxPrice,
    jupiter: fetchJupiterSpyxPrice,
    coingecko: fetchCoinGeckoSpyxPrice,
  };
  let pythHeldUntil = 0;

  return async function marketPrice(now: number): Promise<PriceDto> {
    const key = deps.pythKey();
    if (key && now >= pythHeldUntil) {
      try {
        return await sources.pyth(key, now, fetch, deps.hermesUrl());
      } catch (error) {
        if (!isUnavailable(error)) throw error;
        if (error instanceof PythRefusedError) {
          pythHeldUntil = now + PYTH_REFUSAL_HOLD_SECONDS;
          console.warn(
            `pyth refused the key (${error.hermesStatus}); using Jupiter for ${PYTH_REFUSAL_HOLD_SECONDS / 60} minutes`,
          );
        }
      }
    }

    try {
      return await sources.jupiter(now);
    } catch (error) {
      if (!isUnavailable(error)) throw error;
    }

    const multiplier = await deps.multiplier().catch((error: unknown) => {
      console.error('price fallback could not read the multiplier', error);
      return null;
    });
    if (multiplier === null) throw unavailable();
    return sources.coingecko(multiplier, now);
  };
}
