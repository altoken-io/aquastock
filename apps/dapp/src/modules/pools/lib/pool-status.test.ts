import { describe, expect, it } from 'vitest';

import { poolPhase, reservedFraction, secondsLeft } from './pool-status';

const NOW = 1_800_000_000;
const pool = (over: { endsAt?: number; unreserved?: string } = {}) => ({
  endsAt: NOW + 10 * 86_400,
  unreserved: '500',
  ...over,
});

describe('poolPhase', () => {
  it('is open with time and budget left', () => {
    expect(poolPhase(pool(), NOW)).toBe('open');
  });

  it('is ending soon inside the last day', () => {
    expect(poolPhase(pool({ endsAt: NOW + 86_399 }), NOW)).toBe('ending-soon');
    expect(poolPhase(pool({ endsAt: NOW + 86_400 }), NOW)).toBe('open');
  });

  it('is ended at and after the deadline, whatever budget is left', () => {
    expect(poolPhase(pool({ endsAt: NOW }), NOW)).toBe('ended');
    expect(poolPhase(pool({ endsAt: NOW - 1 }), NOW)).toBe('ended');
    expect(poolPhase(pool({ endsAt: NOW - 1, unreserved: '0' }), NOW)).toBe(
      'ended',
    );
  });

  it('is full when no match is left, even if it is also nearly over', () => {
    expect(poolPhase(pool({ unreserved: '0' }), NOW)).toBe('budget-full');
    expect(poolPhase(pool({ unreserved: '0', endsAt: NOW + 60 }), NOW)).toBe(
      'budget-full',
    );
  });

  it('handles amounts beyond the safe-integer range', () => {
    expect(poolPhase(pool({ unreserved: '18446744073709551615' }), NOW)).toBe(
      'open',
    );
  });
});

describe('reservedFraction', () => {
  it('is the reserved share of the budget, clamped to 0..1', () => {
    expect(reservedFraction({ budgetTotal: '1000', reserved: '250' })).toBe(
      0.25,
    );
    expect(reservedFraction({ budgetTotal: '1000', reserved: '1000' })).toBe(1);
    expect(reservedFraction({ budgetTotal: '1000', reserved: '2000' })).toBe(1);
    expect(reservedFraction({ budgetTotal: '0', reserved: '0' })).toBe(0);
    expect(
      reservedFraction({
        budgetTotal: '18446744073709551615',
        reserved: '9223372036854775807',
      }),
    ).toBeCloseTo(0.5, 3);
  });
});

describe('secondsLeft', () => {
  it('counts down and never goes negative', () => {
    expect(secondsLeft({ endsAt: NOW + 90 }, NOW)).toBe(90);
    expect(secondsLeft({ endsAt: NOW - 90 }, NOW)).toBe(0);
  });
});
