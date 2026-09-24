// Live SPYx/USD from Jupiter's public Price API: the source while Pyth has no key or refuses
// one (a key without the tokenized-stock grant gets 403). Keyless, 30 requests a minute; the
// data cache below keeps this app far under that. Server-only, like the Pyth source.
//
// Jupiter prices the token as a wallet shows it: it reads SPYx's scaled-UI multiplier (its answer
// carries `scaledUiConfig`), and its price sits next to SPY's while a trading pool's raw-token
// price runs above SPY by that multiplier. That is the unit every "≈ $" in this app uses.
import { z } from 'zod';

import type { PriceDto, PriceReferenceDto } from '@aquastock/types';

import { ApiError } from '../api/errors';

/**
 * The real SPYx mint on mainnet. Every network prices this one: the devnet replica mirrors it,
 * and "≈ $" means what the same amount of real SPYx is worth.
 */
export const SPYX_MAINNET_MINT = 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W';

const JUPITER_PRICE_URL = 'https://api.jup.ag/price/v3';

/** Shared by every visitor for this long (Next's data cache), as with Pyth. */
const REVALIDATE_SECONDS = 10;

/** A per-token price outside this range is a broken answer, not a market. */
export const MIN_SANE_PRICE = 0.000001;
export const MAX_SANE_PRICE = 1_000_000;

/**
 * SPY's price can be days old over a weekend or a holiday; older than this it is no longer a
 * fair thing to compare the token with.
 */
export const MAX_REFERENCE_AGE_SECONDS = 4 * 24 * 3_600;

/** Clock skew allowed between us and Jupiter before a reference counts as future-dated. */
const MAX_FUTURE_SECONDS = 60;

// Only the fields this app reads. Jupiter leaves out, or nulls, a mint it cannot price.
// `stockData` is xStocks' own figure for the stock the token tracks (SPY for SPYx); it is
// optional because nothing else depends on it.
const jupiterSchema = z.record(
  z.string(),
  z
    .object({
      usdPrice: z.number(),
      stockData: z
        .object({ price: z.number(), updatedAt: z.string() })
        .nullish()
        .catch(null),
    })
    .nullable(),
);

export const isSanePrice = (value: number): boolean =>
  Number.isFinite(value) && value >= MIN_SANE_PRICE && value <= MAX_SANE_PRICE;

/** SPY's price as Jupiter relays it from xStocks, or null when absent, broken or stale. */
export function parseReference(
  stockData: { price: number; updatedAt: string } | null | undefined,
  now: number,
): PriceReferenceDto | null {
  if (!stockData || !isSanePrice(stockData.price)) return null;
  const updatedAt = Math.floor(Date.parse(stockData.updatedAt) / 1000);
  if (!Number.isFinite(updatedAt)) return null;
  const age = now - updatedAt;
  if (age > MAX_REFERENCE_AGE_SECONDS || age < -MAX_FUTURE_SECONDS) return null;
  return {
    symbol: 'SPY',
    price: numberToDecimal(stockData.price),
    source: 'xstocks',
    updatedAt,
  };
}

const unavailable = () =>
  new ApiError(
    503,
    'price_unavailable',
    'the market price is not available right now',
  );

/** A JS number as a plain decimal string (never exponent notation), to 6 places at most. */
export function numberToDecimal(value: number): string {
  return value.toFixed(6).replace(/\.?0+$/, '');
}

/**
 * The latest SPYx/USD price Jupiter derives from on-chain trades. Jupiter gives no publish
 * time or confidence, so `publishTime` is when it was read and `confidence` is null.
 */
export async function fetchJupiterSpyxPrice(
  now: number,
  fetchImpl: typeof fetch = fetch,
): Promise<PriceDto> {
  let body: unknown;
  try {
    const response = await fetchImpl(
      `${JUPITER_PRICE_URL}?ids=${SPYX_MAINNET_MINT}`,
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
    if (!response.ok) {
      const reason = (await response.text().catch(() => ''))
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300);
      console.error('jupiter price answered', response.status, reason);
      throw unavailable();
    }
    body = await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('jupiter price unreachable', error);
    throw unavailable();
  }

  const parsed = jupiterSchema.safeParse(body);
  const entry = parsed.success ? parsed.data[SPYX_MAINNET_MINT] : undefined;
  const usdPrice = entry?.usdPrice;
  if (usdPrice === undefined || !isSanePrice(usdPrice)) {
    console.error('jupiter price refused', { usdPrice });
    throw unavailable();
  }

  return {
    source: 'jupiter',
    pair: 'SPYx/USD',
    feedId: SPYX_MAINNET_MINT,
    price: numberToDecimal(usdPrice),
    confidence: null,
    publishTime: now,
    reference: parseReference(entry?.stockData, now),
  };
}
