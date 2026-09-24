import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { leaveEarly, leaveEarlyShares } from './leave-early.ts';

const SAMPLE = { deposit: 100, match: 100, months: 12 } as const;

describe('leaveEarly', () => {
  it('returns the whole deposit at every month', () => {
    for (let leaveAt = 0; leaveAt <= SAMPLE.months; leaveAt += 1) {
      assert.equal(leaveEarly({ ...SAMPLE, leaveAt }).depositBack, 100);
    }
  });

  it('vests the match in a straight line, rounded down', () => {
    assert.equal(leaveEarly({ ...SAMPLE, leaveAt: 3 }).matchKept, 25);
    // 100 * 4 / 12 = 33.33: the saver is shown 33, never 34.
    assert.equal(leaveEarly({ ...SAMPLE, leaveAt: 4 }).matchKept, 33);
    assert.equal(leaveEarly({ ...SAMPLE, leaveAt: 12 }).matchKept, 100);
  });

  it('splits the match exactly between saver and sponsor', () => {
    for (let leaveAt = 0; leaveAt <= SAMPLE.months; leaveAt += 1) {
      const { matchKept, matchReturned } = leaveEarly({ ...SAMPLE, leaveAt });
      assert.equal(matchKept + matchReturned, SAMPLE.match);
    }
  });

  it('returns the whole match to the sponsor when leaving at once', () => {
    const result = leaveEarly({ ...SAMPLE, leaveAt: 0 });
    assert.deepEqual(result, {
      month: 0,
      progress: 0,
      depositBack: 100,
      matchKept: 0,
      matchReturned: 100,
    });
  });

  it('clamps out-of-range and non-integer months', () => {
    assert.equal(leaveEarly({ ...SAMPLE, leaveAt: 40 }).month, 12);
    assert.equal(leaveEarly({ ...SAMPLE, leaveAt: -3 }).month, 0);
    assert.equal(leaveEarly({ ...SAMPLE, leaveAt: 5.9 }).month, 5);
    assert.equal(leaveEarly({ ...SAMPLE, leaveAt: Number.NaN }).month, 0);
  });

  it('vests everything when the period has no length', () => {
    const result = leaveEarly({ ...SAMPLE, months: 0, leaveAt: 0 });
    assert.equal(result.progress, 1);
    assert.equal(result.matchKept, 100);
    assert.equal(result.matchReturned, 0);
  });

  it('treats negative or non-finite amounts as zero', () => {
    const result = leaveEarly({
      deposit: -5,
      match: Number.POSITIVE_INFINITY,
      months: 12,
      leaveAt: 6,
    });
    assert.equal(result.depositBack, 0);
    assert.equal(result.matchKept, 0);
    assert.equal(result.matchReturned, 0);
  });
});

describe('leaveEarlyShares', () => {
  it('splits a 1:1 position into deposit, kept and returned halves of the whole', () => {
    const shares = leaveEarlyShares(leaveEarly({ ...SAMPLE, leaveAt: 3 }));
    assert.deepEqual(shares, { deposit: 0.5, kept: 0.125, returned: 0.375 });
  });

  it('always sums to the whole bar', () => {
    for (let leaveAt = 0; leaveAt <= SAMPLE.months; leaveAt += 1) {
      const { deposit, kept, returned } = leaveEarlyShares(
        leaveEarly({ deposit: 70, match: 35, months: 12, leaveAt }),
      );
      assert.ok(Math.abs(deposit + kept + returned - 1) < 1e-9);
    }
  });

  it('draws nothing for an empty position instead of dividing by zero', () => {
    const shares = leaveEarlyShares(
      leaveEarly({ deposit: 0, match: 0, months: 12, leaveAt: 6 }),
    );
    assert.deepEqual(shares, { deposit: 0, kept: 0, returned: 0 });
  });
});
