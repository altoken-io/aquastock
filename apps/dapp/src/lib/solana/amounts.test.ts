import { describe, expect, it } from 'vitest';

import { AmountError, rawToUi, uiToRaw } from './amounts';

const M = '1.005714560286254';

describe('uiToRaw', () => {
  it('converts whole and fractional amounts at multiplier 1', () => {
    expect(uiToRaw('1', 8)).toBe(100_000_000n);
    expect(uiToRaw('12.5', 8)).toBe(1_250_000_000n);
    expect(uiToRaw('0.00000001', 8)).toBe(1n);
    expect(uiToRaw('  3 ', 8)).toBe(300_000_000n);
    expect(uiToRaw('5', 0)).toBe(5n);
  });

  it('divides by the multiplier and rounds down', () => {
    // 100 UI at 1.005714560286254 is 99.4318... tokens of raw value.
    const expected = (100n * 10n ** 8n * 10n ** 15n) / 1_005_714_560_286_254n;
    expect(uiToRaw('100', 8, M)).toBe(expected);
    // A third of a raw unit rounds down to nothing, which is refused rather than sent as zero.
    expect(() => uiToRaw('1', 0, '3')).toThrow('too small');
  });

  it('rounds up on request so a typed amount displays as typed, and stays exact when it divides evenly', () => {
    // Rounded down, a typed 1000 would display as 999.9999 through a multiplier above one.
    const down = uiToRaw('1000', 6, M);
    const up = uiToRaw('1000', 6, M, 'up');
    expect(up - down).toBe(1n);
    expect(rawToUi(down, 6, M, 4)).toBe('999.9999');
    expect(rawToUi(up, 6, M, 4)).toBe('1000');
    // No rounding needed, no extra unit.
    expect(uiToRaw('100', 6, '1', 'up')).toBe(100_000_000n);
    expect(uiToRaw('3', 0, '3', 'up')).toBe(1n);
    // Rounding up never turns zero into something.
    expect(() => uiToRaw('0', 6, M, 'up')).toThrow('too small');
  });

  it('rejects malformed input', () => {
    for (const bad of [
      '',
      ' ',
      '-1',
      '+1',
      '1e3',
      '.5',
      '1.',
      '1,5',
      'abc',
      '0x10',
      '1 2',
      'NaN',
      'Infinity',
    ]) {
      expect(() => uiToRaw(bad, 8), JSON.stringify(bad)).toThrow(AmountError);
    }
  });

  it('rejects zero, sub-unit, too precise and oversized amounts', () => {
    expect(() => uiToRaw('0', 8)).toThrow('too small');
    expect(() => uiToRaw('0.0', 8)).toThrow('too small');
    expect(() => uiToRaw('1.000000001', 8)).toThrow('decimal places');
    expect(() => uiToRaw('184467440737.09551616', 8)).toThrow('too large');
    expect(uiToRaw('184467440737.09551615', 8)).toBe(0xffff_ffff_ffff_ffffn);
  });

  it('rejects invalid decimals and multipliers', () => {
    expect(() => uiToRaw('1', -1)).toThrow(AmountError);
    expect(() => uiToRaw('1', 19)).toThrow(AmountError);
    expect(() => uiToRaw('1', 1.5)).toThrow(AmountError);
    expect(() => uiToRaw('1', 8, '0')).toThrow('greater than zero');
    expect(() => uiToRaw('1', 8, '-1')).toThrow(AmountError);
    expect(() => uiToRaw('1', 8, 'abc')).toThrow(AmountError);
  });
});

describe('AmountError codes', () => {
  it('say why an input was refused, so the UI can react without parsing messages', () => {
    const codeOf = (run: () => unknown): string | undefined => {
      try {
        run();
      } catch (error) {
        return error instanceof AmountError ? error.code : undefined;
      }
      return undefined;
    };
    expect(codeOf(() => uiToRaw('abc', 8))).toBe('format');
    expect(codeOf(() => uiToRaw('1.000000001', 8))).toBe('precision');
    expect(codeOf(() => uiToRaw('0', 8))).toBe('too-small');
    expect(codeOf(() => uiToRaw('184467440737.09551616', 8))).toBe('too-large');
    expect(codeOf(() => uiToRaw('1', 99))).toBe('decimals');
    expect(codeOf(() => uiToRaw('1', 8, '0'))).toBe('multiplier');
    expect(codeOf(() => uiToRaw('1', 8, 'x'))).toBe('multiplier');
  });
});

describe('rawToUi', () => {
  it('formats and trims trailing zeros', () => {
    expect(rawToUi(100_000_000n, 8)).toBe('1');
    expect(rawToUi(1_250_000_000n, 8)).toBe('12.5');
    expect(rawToUi(1n, 8)).toBe('0.00000001');
    expect(rawToUi(0n, 8)).toBe('0');
    expect(rawToUi(5n, 0)).toBe('5');
  });

  it('applies the multiplier and rounds down, never overstating', () => {
    const raw = 100_000_000n;
    const exact =
      (raw * 1_005_714_560_286_254n * 10n ** 8n) / (10n ** 8n * 10n ** 15n);
    expect(rawToUi(raw, 8, M)).toBe(rawToUi(exact, 8));
    expect(rawToUi(raw, 8, M)).toBe('1.00571456');
    expect(rawToUi(1n, 8, '1.999999999', 8)).toBe('0.00000001');
    expect(rawToUi(123_456_789n, 8, '1', 2)).toBe('1.23');
  });

  it('handles the u64 extremes', () => {
    expect(rawToUi(0xffff_ffff_ffff_ffffn, 8)).toBe('184467440737.09551615');
    expect(() => rawToUi(0x1_0000_0000_0000_0000n, 8)).toThrow(AmountError);
    expect(() => rawToUi(-1n, 8)).toThrow(AmountError);
    expect(() => rawToUi(1n, 8, '1', 19)).toThrow(AmountError);
  });
});

describe('round trips', () => {
  // splitmix64, so the property test is deterministic.
  let state = 0x5eed_1234n;
  const next = (): bigint => {
    state = (state + 0x9e37_79b9_7f4a_7c15n) & 0xffff_ffff_ffff_ffffn;
    let z = state;
    z = ((z ^ (z >> 30n)) * 0xbf58_476d_1ce4_e5b9n) & 0xffff_ffff_ffff_ffffn;
    z = ((z ^ (z >> 27n)) * 0x94d0_49bb_1331_11ebn) & 0xffff_ffff_ffff_ffffn;
    return z ^ (z >> 31n);
  };

  it('never returns more than was held, and loses at most a couple of raw units', () => {
    for (let i = 0; i < 2_000; i += 1) {
      const raw = (next() % 1_000_000_000_000n) + 1_000n;
      const multiplier = `${1n + (next() % 2n)}.${(next() % 1_000_000n).toString().padStart(6, '0')}`;
      const ui = rawToUi(raw, 8, multiplier, 8);
      if (ui === '0') continue;
      const back = uiToRaw(ui, 8, multiplier);
      expect(back <= raw, `${raw} ${multiplier}`).toBe(true);
      expect(raw - back <= 2n, `${raw} ${multiplier}`).toBe(true);
    }
  });

  it('typing a displayed balance rounded up never overshoots it and lands on it exactly', () => {
    for (let i = 0; i < 2_000; i += 1) {
      const raw = (next() % 1_000_000_000_000n) + 1_000n;
      const multiplier = `${1n + (next() % 2n)}.${(next() % 1_000_000n).toString().padStart(6, '0')}`;
      const ui = rawToUi(raw, 8, multiplier, 8);
      expect(uiToRaw(ui, 8, multiplier, 'up'), `${raw} ${multiplier}`).toBe(
        raw,
      );
    }
  });

  it('is exact at multiplier 1', () => {
    for (let i = 0; i < 2_000; i += 1) {
      const raw = (next() % 1_000_000_000_000n) + 1n;
      expect(uiToRaw(rawToUi(raw, 8), 8)).toBe(raw);
    }
  });
});
