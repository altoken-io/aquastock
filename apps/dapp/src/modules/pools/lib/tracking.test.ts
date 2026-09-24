import { describe, expect, it } from 'vitest';

import { trackingGap } from './tracking';

describe('trackingGap', () => {
  it('says how far below the fund the token trades', () => {
    // Jupiter's SPYx against xStocks' SPY, 2026-09-24.
    const gap = trackingGap('765.629824', '766.19');
    expect(gap?.direction).toBe('below');
    expect(gap?.share).toBeCloseTo(0.000731, 6);
  });

  it('says how far above it trades', () => {
    const gap = trackingGap('767.374799', '765.95');
    expect(gap?.direction).toBe('above');
    expect(gap?.share).toBeCloseTo(0.00186, 5);
  });

  it('calls a gap that rounds to 0.00% level', () => {
    expect(trackingGap('766.19', '766.19')).toEqual({
      direction: 'level',
      share: 0,
    });
    expect(trackingGap('766.2', '766.19')).toEqual({
      direction: 'level',
      share: 0,
    });
  });

  it('refuses prices it cannot compare', () => {
    expect(trackingGap('0', '766.19')).toBeNull();
    expect(trackingGap('766.19', '0')).toBeNull();
    expect(trackingGap('-1', '766.19')).toBeNull();
    expect(trackingGap('abc', '766.19')).toBeNull();
    expect(trackingGap('766.19', 'Infinity')).toBeNull();
  });
});
