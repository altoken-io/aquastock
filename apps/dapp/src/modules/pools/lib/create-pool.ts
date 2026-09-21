// Everything the create-pool form decides before a wallet is asked: parsing what was typed,
// checking it against the program's own limits (`constants.rs`, `create_pool.rs`), and
// working out what the sponsor's numbers mean. Pure, so it is tested without a browser.
import { poolDescriptionSchema, poolNameSchema } from '@/lib/pools/schemas';
import { AmountError, uiToRaw } from '@/lib/solana/amounts';

export type DurationUnit = 'minutes' | 'hours' | 'days';

export const DURATION_UNITS: readonly DurationUnit[] = [
  'minutes',
  'hours',
  'days',
];

const UNIT_SECONDS: Record<DurationUnit, number> = {
  minutes: 60,
  hours: 3_600,
  days: 86_400,
};

/** Program limits (`constants.rs`). */
export const MIN_VESTING_SECONDS = 30;
export const MAX_DURATION_SECONDS = 5 * 365 * 24 * 60 * 60;
/**
 * A deposit window shorter than this could expire between signing and landing, and clock
 * skew between a browser and the validator would make it flaky. Not a program rule.
 */
export const MIN_WINDOW_SECONDS = 10 * 60;
export const MAX_MATCH_BPS = 10_000;

export interface CreatePoolForm {
  name: string;
  description: string;
  /** "100", "12.5": percent of a deposit the sponsor matches. */
  matchPercent: string;
  /** Most one saver may deposit, as typed in token units. */
  cap: string;
  vestingValue: string;
  vestingUnit: DurationUnit;
  windowValue: string;
  windowUnit: DurationUnit;
  /** The match budget the pool is funded with. */
  budget: string;
}

export const EMPTY_FORM: CreatePoolForm = {
  name: '',
  description: '',
  matchPercent: '100',
  cap: '',
  vestingValue: '30',
  vestingUnit: 'days',
  windowValue: '7',
  windowUnit: 'days',
  budget: '',
};

export type CreatePoolField =
  | 'name'
  | 'description'
  | 'matchPercent'
  | 'cap'
  | 'vesting'
  | 'window'
  | 'budget';

export type FieldProblem =
  | 'required'
  | 'invalid'
  | 'too-long'
  | 'single-line'
  | 'characters'
  | 'precision'
  | 'too-small'
  | 'too-large'
  | 'out-of-range'
  | 'over-balance'
  | 'over-demo-cap'
  | 'demo-cap-unset';

export type CreatePoolErrors = Partial<Record<CreatePoolField, FieldProblem>>;

export const CREATE_POOL_FIELDS: readonly CreatePoolField[] = [
  'name',
  'description',
  'matchPercent',
  'cap',
  'vesting',
  'window',
  'budget',
];

/** The fields that have a problem, in form order. */
export function problemFields(errors: CreatePoolErrors): CreatePoolField[] {
  return CREATE_POOL_FIELDS.filter((field) => errors[field] !== undefined);
}

/** The wizard step a field lives on. */
export function stepOfField(field: CreatePoolField): keyof typeof STEP_FIELDS {
  if (field === 'name' || field === 'description') return 'details';
  return field === 'budget' ? 'fund' : 'rules';
}

export interface CreatePoolContext {
  decimals: number;
  multiplier: string;
  /** The sponsor's balance in raw units; null while unknown (the chain will decide). */
  balanceRaw: bigint | null;
  /**
   * Largest budget or per-saver cap allowed here, in raw units; null means uncapped. Set on
   * mainnet, where a demo must not be able to hold real money it cannot afford to lose.
   */
  demoCapRaw: bigint | null;
  /** True when the cap is required but nobody configured one: creation stays closed. */
  demoCapMissing: boolean;
  /** Unix seconds. */
  now: number;
}

export interface ValidCreatePool {
  name: string;
  description: string | null;
  matchBps: number;
  perSaverCapRaw: bigint;
  vestingSeconds: number;
  windowSeconds: number;
  endsAt: number;
  budgetRaw: bigint;
}

export type CreatePoolResult =
  | { ok: true; value: ValidCreatePool }
  | { ok: false; errors: CreatePoolErrors };

/** "12.5" -> 1250 basis points; exact, never through a float. */
export function percentToBps(text: string): number | null {
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? '').padEnd(2, '0'));
  return whole * 100 + fraction;
}

/** A whole number of minutes/hours/days as seconds; null for anything else. */
export function durationToSeconds(
  value: string,
  unit: DurationUnit,
): number | null {
  if (!/^\d{1,6}$/.test(value.trim())) return null;
  return Number(value.trim()) * UNIT_SECONDS[unit];
}

function amountProblem(error: AmountError): FieldProblem {
  switch (error.code) {
    case 'precision':
      return 'precision';
    case 'too-small':
      return 'too-small';
    case 'too-large':
      return 'too-large';
    default:
      return 'invalid';
  }
}

function parseAmount(
  text: string,
  context: CreatePoolContext,
): { raw: bigint } | { problem: FieldProblem } {
  const trimmed = text.endsWith('.') ? text.slice(0, -1) : text;
  if (trimmed.trim() === '') return { problem: 'required' };
  try {
    return {
      raw: uiToRaw(trimmed, context.decimals, context.multiplier, 'up'),
    };
  } catch (error) {
    if (error instanceof AmountError) return { problem: amountProblem(error) };
    throw error;
  }
}

/** Checks a whole form. Every problem is reported at once so a person can fix them together. */
export function validateCreatePool(
  form: CreatePoolForm,
  context: CreatePoolContext,
): CreatePoolResult {
  const errors: CreatePoolErrors = {};

  const name = poolNameSchema.safeParse(form.name);
  if (!name.success) {
    const message = name.error.issues[0]?.message ?? '';
    errors.name = message.includes('required')
      ? 'required'
      : message.includes('at most')
        ? 'too-long'
        : message.includes('single line')
          ? 'single-line'
          : 'characters';
  }

  const description = poolDescriptionSchema.safeParse(form.description);
  if (!description.success) {
    errors.description = description.error.issues[0]?.message.includes(
      'at most',
    )
      ? 'too-long'
      : 'characters';
  }

  const matchBps = percentToBps(form.matchPercent);
  if (matchBps === null) {
    errors.matchPercent =
      form.matchPercent.trim() === '' ? 'required' : 'invalid';
  } else if (matchBps < 1 || matchBps > MAX_MATCH_BPS) {
    errors.matchPercent = 'out-of-range';
  }

  const cap = parseAmount(form.cap, context);
  if ('problem' in cap) errors.cap = cap.problem;
  const budget = parseAmount(form.budget, context);
  if ('problem' in budget) errors.budget = budget.problem;

  if (context.demoCapMissing) {
    errors.budget ??= 'demo-cap-unset';
  } else if (context.demoCapRaw !== null) {
    if ('raw' in cap && cap.raw > context.demoCapRaw) {
      errors.cap ??= 'over-demo-cap';
    }
    if ('raw' in budget && budget.raw > context.demoCapRaw) {
      errors.budget ??= 'over-demo-cap';
    }
  }
  if (
    'raw' in budget &&
    context.balanceRaw !== null &&
    budget.raw > context.balanceRaw
  ) {
    errors.budget ??= 'over-balance';
  }

  const vestingSeconds = durationToSeconds(form.vestingValue, form.vestingUnit);
  if (vestingSeconds === null) {
    errors.vesting = form.vestingValue.trim() === '' ? 'required' : 'invalid';
  } else if (
    vestingSeconds < MIN_VESTING_SECONDS ||
    vestingSeconds > MAX_DURATION_SECONDS
  ) {
    errors.vesting = 'out-of-range';
  }

  const windowSeconds = durationToSeconds(form.windowValue, form.windowUnit);
  if (windowSeconds === null) {
    errors.window = form.windowValue.trim() === '' ? 'required' : 'invalid';
  } else if (
    windowSeconds < MIN_WINDOW_SECONDS ||
    windowSeconds > MAX_DURATION_SECONDS
  ) {
    errors.window = 'out-of-range';
  }

  if (
    Object.keys(errors).length > 0 ||
    !name.success ||
    !description.success ||
    matchBps === null ||
    !('raw' in cap) ||
    !('raw' in budget) ||
    vestingSeconds === null ||
    windowSeconds === null
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name: name.data,
      description: description.data,
      matchBps,
      perSaverCapRaw: cap.raw,
      vestingSeconds,
      windowSeconds,
      endsAt: context.now + windowSeconds,
      budgetRaw: budget.raw,
    },
  };
}

export interface Draft {
  matchBps: number | null;
  capRaw: bigint | null;
  budgetRaw: bigint | null;
  /**
   * The cap and budget exactly as typed (10^decimals per token, multiplier 1). "What does this
   * buy" is arithmetic on what the sponsor typed, not on raw units, which carry a rounding unit
   * from the display multiplier that would turn 500 / 100 into 4.
   */
  capUnits: bigint | null;
  budgetUnits: bigint | null;
  vestingSeconds: number | null;
  windowSeconds: number | null;
}

/**
 * Whatever in the form already parses, for the live preview. Unlike `validateCreatePool` it
 * never complains: a half-typed form still previews the parts that are readable.
 */
export function parseDraft(
  form: CreatePoolForm,
  context: Pick<CreatePoolContext, 'decimals' | 'multiplier'>,
): Draft {
  const amount = (text: string, multiplier: string): bigint | null => {
    const parsed = parseAmount(text, {
      decimals: context.decimals,
      multiplier,
      balanceRaw: null,
      demoCapRaw: null,
      demoCapMissing: false,
      now: 0,
    });
    return 'raw' in parsed ? parsed.raw : null;
  };
  return {
    matchBps: percentToBps(form.matchPercent),
    capRaw: amount(form.cap, context.multiplier),
    budgetRaw: amount(form.budget, context.multiplier),
    capUnits: amount(form.cap, '1'),
    budgetUnits: amount(form.budget, '1'),
    vestingSeconds: durationToSeconds(form.vestingValue, form.vestingUnit),
    windowSeconds: durationToSeconds(form.windowValue, form.windowUnit),
  };
}

/** Which fields belong to which wizard step, so a step only blocks on its own problems. */
export const STEP_FIELDS = {
  details: ['name', 'description'],
  rules: ['matchPercent', 'cap', 'vesting', 'window'],
  fund: ['budget'],
} as const satisfies Record<string, readonly CreatePoolField[]>;

export type WizardStep = keyof typeof STEP_FIELDS | 'review';

export function stepErrors(
  step: keyof typeof STEP_FIELDS,
  errors: CreatePoolErrors,
): CreatePoolErrors {
  const own: CreatePoolErrors = {};
  for (const field of STEP_FIELDS[step]) {
    const problem = errors[field];
    if (problem) own[field] = problem;
  }
  return own;
}

export interface PoolReach {
  /** Match a saver depositing exactly the cap would receive, in the units of the inputs. */
  matchAtCap: bigint;
  /**
   * How many savers depositing the cap the budget can match in full. Null when a deposit at the
   * cap would earn no match (then the budget is never spent).
   */
  fullyMatchedSavers: bigint | null;
}

/** What the budget buys, so a sponsor sees "10 savers" instead of two abstract numbers. */
export function poolReach(
  budget: bigint,
  perSaverCap: bigint,
  matchBps: number,
): PoolReach {
  const matchAtCap = (perSaverCap * BigInt(matchBps)) / 10_000n;
  return {
    matchAtCap,
    fullyMatchedSavers: matchAtCap === 0n ? null : budget / matchAtCap,
  };
}
