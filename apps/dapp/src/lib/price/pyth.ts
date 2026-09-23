// Live SPYx/USD from Pyth's Hermes service. Server-only: the API key never reaches a browser.
import { z } from 'zod';

import type { PriceDto } from '@aquastock/types';

import { ApiError } from '../api/errors';

/** Pyth's `Crypto.SPYX/USD` feed: the SP500 xStock (SPYx) in US dollars. */
export const SPYX_USD_FEED_ID =
  '2817b78438c769357182c04346fddaad1178c82f4048828fe0997c3c64624e14';

const HERMES_URL = 'https://hermes.pyth.network';

/** Older than this, a price says more about a stalled feed than about the market. */
export const MAX_PRICE_AGE_SECONDS = 6 * 3_600;

/** Hermes answers are shared by every visitor for this long (Next's data cache). */
const REVALIDATE_SECONDS = 10;

const integerString = z.string().regex(/^-?\d{1,30}$/);

// Only the fields this app reads; Hermes sends more.
const hermesSchema = z.object({
  parsed: z
    .array(
      z.object({
        id: z.string(),
        price: z.object({
          price: integerString,
          conf: integerString,
          expo: z.number().int().min(-18).max(18),
          publish_time: z.number().int().positive(),
        }),
      }),
    )
    .min(1),
});

/** Pyth's fixed-point `mantissa × 10^expo` as an exact decimal string. */
export function toDecimal(mantissa: bigint, expo: number): string {
  const negative = mantissa < 0n;
  const digits = (negative ? -mantissa : mantissa).toString();
  let result: string;
  if (expo >= 0) {
    result = digits + '0'.repeat(expo);
  } else {
    const places = -expo;
    const padded = digits.padStart(places + 1, '0');
    const whole = padded.slice(0, padded.length - places);
    const fraction = padded.slice(padded.length - places).replace(/0+$/, '');
    result = fraction ? `${whole}.${fraction}` : whole;
  }
  return negative ? `-${result}` : result;
}

const unavailable = () =>
  new ApiError(
    503,
    'price_unavailable',
    'the market price is not available right now',
  );

/**
 * The latest SPYx/USD price. Throws `price_unavailable` for anything a person should not see
 * as a price: Hermes down or refusing the key, a malformed answer, a non-positive or stale price.
 */
export async function fetchSpyxPrice(
  apiKey: string,
  now: number,
  fetchImpl: typeof fetch = fetch,
): Promise<PriceDto> {
  let body: unknown;
  try {
    const response = await fetchImpl(
      `${HERMES_URL}/v2/updates/price/latest?ids%5B%5D=${SPYX_USD_FEED_ID}&parsed=true&encoding=hex`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (!response.ok) {
      // The status is enough to tell a rejected key (401/403) from an outage; never the key.
      console.error('pyth hermes answered', response.status);
      throw unavailable();
    }
    body = await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('pyth hermes unreachable', error);
    throw unavailable();
  }

  const parsed = hermesSchema.safeParse(body);
  const feed = parsed.success
    ? parsed.data.parsed.find(
        (p) => p.id.replace(/^0x/, '') === SPYX_USD_FEED_ID,
      )
    : undefined;
  if (!feed) {
    console.error('pyth hermes sent an unexpected answer');
    throw unavailable();
  }

  const mantissa = BigInt(feed.price.price);
  const age = now - feed.price.publish_time;
  if (mantissa <= 0n || age > MAX_PRICE_AGE_SECONDS) {
    // Every refusal leaves a reason in the server log, so an operator can tell a stalled feed
    // from a rejected key without guessing.
    console.error('pyth price refused', {
      positive: mantissa > 0n,
      ageSeconds: age,
    });
    throw unavailable();
  }

  return {
    pair: 'SPYx/USD',
    feedId: SPYX_USD_FEED_ID,
    price: toDecimal(mantissa, feed.price.expo),
    confidence: toDecimal(BigInt(feed.price.conf), feed.price.expo),
    publishTime: feed.price.publish_time,
  };
}
