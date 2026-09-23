// Dollar values for token amounts, from a live price. Display only: every number the app acts
// on stays in exact raw units, and a dollar figure is always marked as approximate.
import { rawToUi } from '@/lib/solana/amounts';

/**
 * US dollars for a raw amount, as "$612" or "$0.45". Whole dollars from $100 up, cents below,
 * so the figure never claims more precision than a moving price has. Null when the inputs
 * cannot produce a meaningful number.
 */
export function formatUsd(
  raw: bigint,
  decimals: number,
  multiplier: string,
  price: string,
  locale: string,
): string | null {
  const tokens = Number(rawToUi(raw, decimals, multiplier));
  const perToken = Number(price);
  if (!Number.isFinite(tokens) || !Number.isFinite(perToken) || perToken <= 0)
    return null;
  const usd = tokens * perToken;
  const whole = Math.abs(usd) >= 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(usd);
}
