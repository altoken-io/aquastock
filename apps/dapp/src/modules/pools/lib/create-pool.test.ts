import { describe, expect, it } from 'vitest';

import {
  EMPTY_FORM,
  durationToSeconds,
  percentToBps,
  parseDraft,
  poolReach,
  problemFields,
  stepOfField,
  stepErrors,
  validateCreatePool,
  type CreatePoolContext,
  type CreatePoolForm,
} from './create-pool';

const ONE = 10n ** 8n;
const context = (over: Partial<CreatePoolContext> = {}): CreatePoolContext => ({
  decimals: 8,
  multiplier: '1',
  balanceRaw: 5_000n * ONE,
  demoCapRaw: null,
  demoCapMissing: false,
  now: 1_800_000_000,
  ...over,
});
const form = (over: Partial<CreatePoolForm> = {}): CreatePoolForm => ({
  ...EMPTY_FORM,
  name: 'Lima teachers',
  cap: '100',
  budget: '1000',
  ...over,
});

describe('percentToBps', () => {
  it('is exact for whole and fractional percents', () => {
    expect(percentToBps('100')).toBe(10_000);
    expect(percentToBps('12.5')).toBe(1_250);
    expect(percentToBps('0.01')).toBe(1);
    expect(percentToBps('7.05')).toBe(705);
    expect(percentToBps(' 50 ')).toBe(5_000);
  });

  it('rejects anything that is not a plain percent', () => {
    for (const bad of [
      '',
      '-5',
      '1e2',
      '12.345',
      '1,5',
      '.5',
      '5.',
      'abc',
      '1000',
    ]) {
      expect(percentToBps(bad), bad).toBeNull();
    }
  });
});

describe('durationToSeconds', () => {
  it('multiplies whole numbers by the unit', () => {
    expect(durationToSeconds('3', 'minutes')).toBe(180);
    expect(durationToSeconds('2', 'hours')).toBe(7_200);
    expect(durationToSeconds('30', 'days')).toBe(2_592_000);
  });

  it('rejects fractions, signs, blanks and huge values', () => {
    for (const bad of ['', '1.5', '-1', '1e3', 'x', '9999999']) {
      expect(durationToSeconds(bad, 'days'), bad).toBeNull();
    }
  });
});

describe('validateCreatePool', () => {
  it('accepts a normal pool and computes what the program will be told', () => {
    const result = validateCreatePool(form(), context());
    expect(result).toEqual({
      ok: true,
      value: {
        name: 'Lima teachers',
        description: null,
        matchBps: 10_000,
        perSaverCapRaw: 100n * ONE,
        vestingSeconds: 30 * 86_400,
        windowSeconds: 7 * 86_400,
        endsAt: 1_800_000_000 + 7 * 86_400,
        budgetRaw: 1_000n * ONE,
      },
    });
  });

  it('trims the name and turns a blank description into none', () => {
    const result = validateCreatePool(
      form({ name: '  Lima teachers  ', description: '   ' }),
      context(),
    );
    expect(result.ok && result.value.name).toBe('Lima teachers');
    expect(result.ok && result.value.description).toBeNull();
  });

  it('reports every problem at once', () => {
    const result = validateCreatePool(
      form({
        name: '',
        cap: '',
        budget: '0',
        matchPercent: '150',
        vestingValue: '5',
        vestingUnit: 'minutes',
        windowValue: '1',
        windowUnit: 'minutes',
      }),
      context(),
    );
    expect(result).toEqual({
      ok: false,
      errors: {
        name: 'required',
        cap: 'required',
        budget: 'too-small',
        matchPercent: 'out-of-range',
        window: 'out-of-range',
      },
    });
  });

  it('enforces the program limits on vesting', () => {
    const at = (value: string, unit: 'minutes' | 'days') =>
      validateCreatePool(
        form({ vestingValue: value, vestingUnit: unit }),
        context(),
      );
    expect(at('29', 'minutes').ok).toBe(true);
    // 30 seconds is the floor, but the form only offers minutes and up: 1 minute passes.
    expect(at('1', 'minutes').ok).toBe(true);
    expect(at('1826', 'days')).toMatchObject({
      ok: false,
      errors: { vesting: 'out-of-range' },
    });
    expect(at('1825', 'days').ok).toBe(true);
    expect(at('0', 'days')).toMatchObject({
      ok: false,
      errors: { vesting: 'out-of-range' },
    });
  });

  it('keeps the deposit window between ten minutes and five years', () => {
    const at = (value: string, unit: 'minutes' | 'days') =>
      validateCreatePool(
        form({ windowValue: value, windowUnit: unit }),
        context(),
      );
    expect(at('9', 'minutes')).toMatchObject({
      ok: false,
      errors: { window: 'out-of-range' },
    });
    expect(at('10', 'minutes').ok).toBe(true);
    expect(at('1826', 'days')).toMatchObject({
      ok: false,
      errors: { window: 'out-of-range' },
    });
  });

  it('refuses a budget the sponsor does not hold, but not while the balance is unknown', () => {
    expect(
      validateCreatePool(form({ budget: '6000' }), context()),
    ).toMatchObject({
      ok: false,
      errors: { budget: 'over-balance' },
    });
    expect(
      validateCreatePool(
        form({ budget: '6000' }),
        context({ balanceRaw: null }),
      ).ok,
    ).toBe(true);
    expect(validateCreatePool(form({ budget: '5000' }), context()).ok).toBe(
      true,
    );
  });

  it('applies the demo cap to both the budget and the per-saver cap', () => {
    const capped = context({ demoCapRaw: 10n * ONE });
    expect(
      validateCreatePool(form({ cap: '5', budget: '10' }), capped).ok,
    ).toBe(true);
    expect(
      validateCreatePool(form({ cap: '11', budget: '10' }), capped),
    ).toMatchObject({
      ok: false,
      errors: { cap: 'over-demo-cap' },
    });
    expect(
      validateCreatePool(form({ cap: '5', budget: '10.5' }), capped),
    ).toMatchObject({
      ok: false,
      errors: { budget: 'over-demo-cap' },
    });
  });

  it('stays closed when a cap is required and nobody set one', () => {
    expect(
      validateCreatePool(form(), context({ demoCapMissing: true })),
    ).toMatchObject({ ok: false, errors: { budget: 'demo-cap-unset' } });
  });

  it('rejects names and descriptions the server would refuse', () => {
    expect(validateCreatePool(form({ name: 'a\nb' }), context())).toMatchObject(
      {
        errors: { name: 'single-line' },
      },
    );
    expect(
      validateCreatePool(form({ name: 'x'.repeat(81) }), context()),
    ).toMatchObject({
      errors: { name: 'too-long' },
    });
    expect(
      validateCreatePool(form({ name: 'bad\u0000name' }), context()),
    ).toMatchObject({
      errors: { name: 'characters' },
    });
    expect(
      validateCreatePool(form({ description: 'y'.repeat(501) }), context()),
    ).toMatchObject({ errors: { description: 'too-long' } });
  });

  it('rounds typed amounts up through the multiplier so they display as typed', () => {
    const result = validateCreatePool(
      form({ cap: '100', budget: '1000' }),
      context({ multiplier: '1.005714560286254' }),
    );
    expect(result.ok && result.value.budgetRaw).toBe(
      (1_000n * ONE * 10n ** 15n) / 1_005_714_560_286_254n + 1n,
    );
  });
});

describe('stepErrors', () => {
  it('lets a step block only on its own fields', () => {
    const errors = {
      name: 'required',
      cap: 'invalid',
      budget: 'too-small',
    } as const;
    expect(stepErrors('details', errors)).toEqual({ name: 'required' });
    expect(stepErrors('rules', errors)).toEqual({ cap: 'invalid' });
    expect(stepErrors('fund', errors)).toEqual({ budget: 'too-small' });
  });
});

describe('poolReach', () => {
  it('says how many capped savers the budget matches in full', () => {
    expect(poolReach(1_000n * ONE, 100n * ONE, 10_000)).toEqual({
      matchAtCap: 100n * ONE,
      fullyMatchedSavers: 10n,
    });
    // A 50% match halves what each saver takes, doubling the reach.
    expect(poolReach(1_000n * ONE, 100n * ONE, 5_000).fullyMatchedSavers).toBe(
      20n,
    );
    // Rounds down: 250 covers two full matches of 100, not two and a half.
    expect(poolReach(250n * ONE, 100n * ONE, 10_000).fullyMatchedSavers).toBe(
      2n,
    );
  });

  it('has no reach when a capped deposit earns nothing', () => {
    expect(poolReach(1_000n * ONE, 1n, 1).fullyMatchedSavers).toBeNull();
  });
});

describe('parseDraft', () => {
  it('previews what parses and leaves the rest empty', () => {
    expect(
      parseDraft(
        form({ cap: '', budget: '250', matchPercent: 'abc' }),
        context(),
      ),
    ).toEqual({
      matchBps: null,
      capRaw: null,
      budgetRaw: 250n * ONE,
      capUnits: null,
      budgetUnits: 250n * ONE,
      vestingSeconds: 30 * 86_400,
      windowSeconds: 7 * 86_400,
    });
  });

  it('never throws on half-typed input', () => {
    for (const cap of ['1.', '.', '0', '99999999999999999999999', '1e5', ' ']) {
      expect(() =>
        parseDraft(form({ cap, budget: cap }), context()),
      ).not.toThrow();
    }
  });
});

describe('problemFields and stepOfField', () => {
  it('lists problem fields in form order and places each on its step', () => {
    expect(
      problemFields({ budget: 'required', name: 'required', cap: 'invalid' }),
    ).toEqual(['name', 'cap', 'budget']);
    expect(problemFields({})).toEqual([]);
    expect(stepOfField('name')).toBe('details');
    expect(stepOfField('description')).toBe('details');
    for (const field of ['matchPercent', 'cap', 'vesting', 'window'] as const) {
      expect(stepOfField(field)).toBe('rules');
    }
    expect(stepOfField('budget')).toBe('fund');
  });
});

describe('reach through a display multiplier', () => {
  it('is computed from what was typed, so 500 over 100 is five savers, not four', () => {
    const multiplier = '1.005714560286254';
    const draft = parseDraft(
      form({ cap: '100', budget: '500' }),
      context({ multiplier }),
    );
    if (
      draft.budgetUnits === null ||
      draft.capUnits === null ||
      draft.budgetRaw === null ||
      draft.capRaw === null
    ) {
      throw new Error('expected a readable draft');
    }
    expect(
      poolReach(draft.budgetUnits, draft.capUnits, 10_000).fullyMatchedSavers,
    ).toBe(5n);
    // On raw units each amount carries a rounding unit, which is why they are not used.
    expect(
      poolReach(draft.budgetRaw, draft.capRaw, 10_000).fullyMatchedSavers,
    ).toBe(4n);
  });
});
