// Display formatting. Amounts always come from exact BigInt arithmetic (`lib/solana/amounts`),
// never from floats; the multiplier is the mint's scaled-UI multiplier as a decimal string.
import { rawToUi } from '@/lib/solana/amounts';

/** Real money: `mainnet-beta` is the cluster's name, and `mainnet` is a common spelling of it. */
export function isMainnet(network: string): boolean {
  return network === 'mainnet-beta' || network === 'mainnet';
}

/**
 * The app's `es` is Peruvian Spanish (see docs/TONE.md), which groups with commas and uses
 * a dot for decimals, unlike Intl's plain `es` (Spain). Map once so every number agrees.
 */
export function toIntlLocale(locale: string): string {
  if (locale === 'es') return 'es-PE';
  if (locale === 'en') return 'en-US';
  return locale;
}

/**
 * Formats raw token units the way a wallet would show them: scaled by the multiplier and
 * grouped for the locale. Small amounts get more fraction digits so a deposit of 0.05 never
 * shows as 0.
 *
 * Rounding is to nearest by default, so a derived figure such as budget minus reservation reads
 * 960, not 959.9999. Pass `rounding: 'down'` for a balance a person may type back into an
 * input: they can then never enter more than they hold.
 */
export function formatTokens(
  raw: bigint,
  decimals: number,
  multiplier: string,
  locale: string,
  options: { minFractionDigits?: number; rounding?: 'nearest' | 'down' } = {},
): string {
  const min = options.minFractionDigits ?? 0;
  // Enough digits that the leading significant digit of a small amount is visible.
  const plain = rawToUi(raw, decimals, multiplier, decimals);
  const value = Number(plain);
  const max = value >= 0.01 || value === 0 ? 4 : Math.min(8, decimals);
  const trimmed =
    options.rounding === 'down'
      ? rawToUi(raw, decimals, multiplier, max)
      : roundHalfUp(rawToUi(raw, decimals, multiplier, max + 1), max);

  const [whole = '0', fraction = ''] = trimmed.split('.');
  const parts = new Intl.NumberFormat(locale, {
    useGrouping: true,
  }).formatToParts(BigInt(whole));
  const integer = parts.map((part) => part.value).join('');
  const separator =
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find((part) => part.type === 'decimal')?.value ?? '.';
  const padded = fraction.padEnd(min, '0');
  return padded === '' ? integer : `${integer}${separator}${padded}`;
}

/**
 * Rounds a plain decimal string (as `rawToUi` returns it, one digit longer than wanted) to
 * `digits` fraction digits, half up, in exact integer arithmetic.
 */
function roundHalfUp(plain: string, digits: number): string {
  const [whole = '0', fraction = ''] = plain.split('.');
  const scaled = BigInt(whole + fraction.padEnd(digits + 1, '0'));
  const rounded = ((scaled + 5n) / 10n).toString().padStart(digits + 1, '0');
  const integer = rounded.slice(0, rounded.length - digits);
  const decimals = rounded.slice(rounded.length - digits).replace(/0+$/, '');
  return decimals === '' ? integer : `${integer}.${decimals}`;
}

const MINUTE = 60;
const HOUR = 3_600;
const DAY = 86_400;

/** Threshold below which a vesting period is a demo setting, not a real savings horizon. */
export const DEMO_TIMESCALE_SECONDS = 7 * DAY;

export function isDemoTimescale(vestingSeconds: number): boolean {
  return vestingSeconds < DEMO_TIMESCALE_SECONDS;
}

type DurationUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';

function pickUnit(seconds: number): { unit: DurationUnit; value: number } {
  if (seconds < 2 * MINUTE)
    return { unit: 'second', value: Math.round(seconds) };
  if (seconds < 2 * HOUR)
    return { unit: 'minute', value: Math.round(seconds / MINUTE) };
  if (seconds < 2 * DAY)
    return { unit: 'hour', value: Math.round(seconds / HOUR) };
  if (seconds < 60 * DAY)
    return { unit: 'day', value: Math.round(seconds / DAY) };
  if (seconds < 730 * DAY)
    return { unit: 'month', value: Math.round(seconds / (30 * DAY)) };
  return { unit: 'year', value: Math.round(seconds / (365 * DAY)) };
}

/** "3 minutes", "30 days", "6 months": one unit, localized, rounded to a whole number. */
export function formatDuration(seconds: number, locale: string): string {
  const { unit, value } = pickUnit(Math.max(0, seconds));
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'long',
    maximumFractionDigits: 0,
  }).format(value);
}

export function shortAddress(address: string, edge = 4): string {
  return address.length <= edge * 2 + 1
    ? address
    : `${address.slice(0, edge)}…${address.slice(-edge)}`;
}

export type ExplorerKind = 'tx' | 'address';

/** Explorer link for the configured cluster. The local validator needs a custom URL. */
export function explorerUrl(
  network: string,
  kind: ExplorerKind,
  id: string,
  rpcUrl = 'http://127.0.0.1:8899',
): string {
  const base = `https://explorer.solana.com/${kind}/${encodeURIComponent(id)}`;
  if (network === 'mainnet-beta') return base;
  if (network === 'devnet') return `${base}?cluster=devnet`;
  return `${base}?cluster=custom&customUrl=${encodeURIComponent(rpcUrl)}`;
}

/** Locale-aware relative time for the activity feed: "2 minutes ago". */
export function formatRelativeTime(
  from: Date,
  now: Date,
  locale: string,
): string {
  const seconds = Math.round((from.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (abs < MINUTE) return formatter.format(seconds, 'second');
  if (abs < HOUR)
    return formatter.format(Math.round(seconds / MINUTE), 'minute');
  if (abs < DAY) return formatter.format(Math.round(seconds / HOUR), 'hour');
  return formatter.format(Math.round(seconds / DAY), 'day');
}
