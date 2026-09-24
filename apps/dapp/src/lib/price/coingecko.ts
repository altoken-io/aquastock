// Last-resort SPYx/USD from CoinGecko's public API, for when Pyth and Jupiter both fail. Keyless
// and tightly rate-limited, which suits a fallback that rarely runs. Server-only.
//
// CoinGecko prices the raw token, as a trading pool does, so its SPYx price runs above SPY by the
// token's scaled-UI multiplier (about 1.0057 since June 2026). Every "≈ $" in this app is per
// token as a wallet shows it, so the raw price is divided by the multiplier read from the mint.
// Without a multiplier there is no honest conversion, and no price.
import { z } from 'zod';

import type { PriceDto } from '@aquastock/types';

import { ApiError } from '../api/errors';
import { SPYX_MAINNET_MINT, isSanePrice, numberToDecimal } from './jupiter';

const COINGECKO_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/token_price/solana';

/** Shared by every visitor for this long (Next's data cache), as with the other sources. */
const REVALIDATE_SECONDS = 30;

/** CoinGecko refreshes every minute or so; much older than this, the price has stalled. */
export const MAX_COINGECKO_AGE_SECONDS = 30 * 60;

/** Clock skew allowed before a price counts as future-dated. */
const MAX_FUTURE_SECONDS = 60;

// Only the fields this app reads; keys are the lower-cased or as-sent contract address.
const coingeckoSchema = z.record(
  z.string(),
  z.object({
    usd: z.number(),
    last_updated_at: z.number().int().positive(),
  }),
);

const unavailable = () =>
  new ApiError(
    503,
    'price_unavailable',
    'the market price is not available right now',
  );

/**
 * The latest SPYx/USD from CoinGecko, per token as a wallet shows it. `multiplier` is the mint's
 * current scaled-UI multiplier as a decimal string, for example "1.005714560286254".
 */
export async function fetchCoinGeckoSpyxPrice(
  multiplier: string,
  now: number,
  fetchImpl: typeof fetch = fetch,
): Promise<PriceDto> {
  const scale = Number(multiplier);
  if (!Number.isFinite(scale) || scale <= 0) {
    console.error('coingecko price skipped: no usable multiplier', {
      multiplier,
    });
    throw unavailable();
  }

  let body: unknown;
  try {
    const response = await fetchImpl(
      `${COINGECKO_PRICE_URL}?contract_addresses=${SPYX_MAINNET_MINT}&vs_currencies=usd&include_last_updated_at=true`,
      {
        headers: { accept: 'application/json' },
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (!response.ok) {
      const reason = (await response.text().catch(() => ''))
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300);
      console.error('coingecko price answered', response.status, reason);
      throw unavailable();
    }
    body = await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('coingecko price unreachable', error);
    throw unavailable();
  }

  const parsed = coingeckoSchema.safeParse(body);
  const entry = parsed.success
    ? (parsed.data[SPYX_MAINNET_MINT] ??
      parsed.data[SPYX_MAINNET_MINT.toLowerCase()])
    : undefined;
  const age = entry ? now - entry.last_updated_at : Number.NaN;
  if (
    !entry ||
    !isSanePrice(entry.usd) ||
    !(age <= MAX_COINGECKO_AGE_SECONDS && age >= -MAX_FUTURE_SECONDS)
  ) {
    console.error('coingecko price refused', {
      usd: entry?.usd,
      ageSeconds: Number.isNaN(age) ? null : age,
    });
    throw unavailable();
  }

  return {
    source: 'coingecko',
    pair: 'SPYx/USD',
    feedId: SPYX_MAINNET_MINT,
    price: numberToDecimal(entry.usd / scale),
    confidence: null,
    publishTime: entry.last_updated_at,
    reference: null,
  };
}
