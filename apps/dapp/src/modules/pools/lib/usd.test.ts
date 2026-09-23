import { describe, expect, it } from 'vitest';

import { formatUsd } from './usd';

describe('formatUsd', () => {
  it('prices whole-token amounts in whole dollars from $100', () => {
    // 100 tokens at 8 decimals, no multiplier, $612.3456 each.
    expect(formatUsd(10_000_000_000n, 8, '1', '612.3456', 'en-US')).toBe(
      '$61,235',
    );
  });

  it('keeps cents below $100', () => {
    expect(formatUsd(100_000n, 8, '1', '612.3456', 'en-US')).toBe('$0.61');
    expect(formatUsd(10_000_000n, 8, '1', '612.3456', 'en-US')).toBe('$61.23');
    expect(formatUsd(0n, 8, '1', '612.3456', 'en-US')).toBe('$0.00');
  });

  it('applies the display multiplier, the same way balances are shown', () => {
    // The raw amount the faucet sends shows as 100 tokens: worth 100 × price.
    expect(
      formatUsd(9_943_179_104n, 8, '1.005714560286254', '600', 'en-US'),
    ).toBe('$60,000');
  });

  it('follows the locale', () => {
    expect(formatUsd(10_000_000_000n, 8, '1', '612.3456', 'es-PE')).toMatch(
      /61[,.]?235/,
    );
  });

  it('gives no figure for a price that is not a positive number', () => {
    expect(formatUsd(1n, 8, '1', '0', 'en-US')).toBeNull();
    expect(formatUsd(1n, 8, '1', 'abc', 'en-US')).toBeNull();
  });
});
