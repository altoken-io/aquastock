// Live SPYx/USD from Jupiter's public Price API: the fallback when Pyth has no key or refuses
// one (a key without the tokenized-stock grant gets 403). Keyless, 30 requests a minute; the
// data cache below keeps this app far under that. Server-only, like the Pyth source.
import { z } from 'zod';

import type { PriceDto } from '@aquastock/types';

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
const MIN_SANE_PRICE = 0.000001;
const MAX_SANE_PRICE = 1_000_000;

// Only the field this app reads. Jupiter leaves out, or nulls, a mint it cannot price.
const jupiterSchema = z.record(
  z.string(),
  z.object({ usdPrice: z.number() }).nullable(),
);

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
  const usdPrice = parsed.success
    ? parsed.data[SPYX_MAINNET_MINT]?.usdPrice
    : undefined;
  if (
    usdPrice === undefined ||
    !Number.isFinite(usdPrice) ||
    usdPrice < MIN_SANE_PRICE ||
    usdPrice > MAX_SANE_PRICE
  ) {
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
  };
}
