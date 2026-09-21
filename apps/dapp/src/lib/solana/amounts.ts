// The single place that converts between what a person types or reads (UI amounts) and
// what the chain stores (raw integer units).
//
// Token-2022's scaled-UI-amount extension shows `ui = raw / 10^decimals * multiplier`.
// Everything here is exact BigInt arithmetic on decimal strings, never floats. The
// multiplier is passed as a decimal string (for example "1.005714560286254").

export type AmountErrorCode =
  | 'format'
  | 'precision'
  | 'too-small'
  | 'too-large'
  | 'decimals'
  | 'multiplier';

export class AmountError extends Error {
  constructor(
    message: string,
    readonly code: AmountErrorCode,
  ) {
    super(message);
    this.name = 'AmountError';
  }
}

const DECIMAL_PATTERN = /^(\d+)(?:\.(\d+))?$/;
const U64_MAX = 0xffff_ffff_ffff_ffffn;
const MAX_DECIMALS = 18;

interface Fraction {
  numerator: bigint;
  denominator: bigint;
  fractionDigits: number;
}

function parseDecimal(text: string, label: string): Fraction {
  const match = DECIMAL_PATTERN.exec(text.trim());
  const whole = match?.[1];
  if (whole === undefined) {
    throw new AmountError(
      `${label} must be a plain decimal number`,
      label === 'multiplier' ? 'multiplier' : 'format',
    );
  }
  const fraction = match?.[2] ?? '';
  return {
    numerator: BigInt(whole + fraction),
    denominator: 10n ** BigInt(fraction.length),
    fractionDigits: fraction.length,
  };
}

function checkDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS) {
    throw new AmountError(
      'decimals must be an integer from 0 to 18',
      'decimals',
    );
  }
}

function parseMultiplier(multiplier: string): Fraction {
  const parsed = parseDecimal(multiplier, 'multiplier');
  if (parsed.numerator === 0n) {
    throw new AmountError('multiplier must be greater than zero', 'multiplier');
  }
  return parsed;
}

export type Rounding = 'down' | 'up';

/**
 * Converts a typed UI amount to raw units. Rejects more fractional digits than the token has
 * decimals, zero, and anything that does not fit in a u64.
 *
 * `rounding: 'down'` (default) never moves more than was typed. `'up'` never moves less: with a
 * display multiplier above 1 one raw unit is worth slightly more than 10^-decimals, so rounding
 * down turns a typed "1000" into a displayed 999.9999. Rounding up is still safe against a
 * balance, because balances are displayed rounded down (typing your displayed balance can never
 * round up past it).
 */
export function uiToRaw(
  ui: string,
  decimals: number,
  multiplier = '1',
  rounding: Rounding = 'down',
): bigint {
  checkDecimals(decimals);
  const amount = parseDecimal(ui, 'amount');
  if (amount.fractionDigits > decimals) {
    throw new AmountError(
      `amount has more than ${decimals} decimal places`,
      'precision',
    );
  }
  const scale = parseMultiplier(multiplier);
  // raw = ui * 10^decimals / multiplier
  const numerator =
    amount.numerator * 10n ** BigInt(decimals) * scale.denominator;
  const denominator = amount.denominator * scale.numerator;
  const floor = numerator / denominator;
  const raw =
    rounding === 'up' && numerator % denominator !== 0n ? floor + 1n : floor;
  if (raw === 0n) {
    throw new AmountError('amount is too small', 'too-small');
  }
  if (raw > U64_MAX) {
    throw new AmountError('amount is too large', 'too-large');
  }
  return raw;
}

/**
 * Formats raw units as a UI amount, rounding down so a balance is never overstated.
 * `fractionDigits` defaults to the token's decimals; trailing zeros are trimmed.
 */
export function rawToUi(
  raw: bigint,
  decimals: number,
  multiplier = '1',
  fractionDigits = decimals,
): string {
  checkDecimals(decimals);
  if (raw < 0n || raw > U64_MAX) {
    throw new AmountError('raw amount must fit in a u64', 'too-large');
  }
  if (
    !Number.isInteger(fractionDigits) ||
    fractionDigits < 0 ||
    fractionDigits > MAX_DECIMALS
  ) {
    throw new AmountError(
      'fractionDigits must be an integer from 0 to 18',
      'decimals',
    );
  }
  const scale = parseMultiplier(multiplier);
  // ui = raw / 10^decimals * multiplier, kept as an integer count of 10^-fractionDigits.
  const units =
    (raw * scale.numerator * 10n ** BigInt(fractionDigits)) /
    (10n ** BigInt(decimals) * scale.denominator);
  const base = 10n ** BigInt(fractionDigits);
  const whole = units / base;
  const fraction = (units % base)
    .toString()
    .padStart(fractionDigits, '0')
    .replace(/0+$/, '');
  return fraction === '' ? whole.toString() : `${whole}.${fraction}`;
}
