import { describe, expect, it } from 'vitest';

import {
  explorerUrl,
  formatDuration,
  formatRelativeTime,
  formatTokens,
  isDemoTimescale,
  isMainnet,
  shortAddress,
  toIntlLocale,
} from './format';

const ONE = 100_000_000n;

describe('formatTokens', () => {
  it('formats whole and fractional amounts with locale grouping', () => {
    expect(formatTokens(1_234n * ONE, 8, '1', 'en-US')).toBe('1,234');
    expect(formatTokens(1_234n * ONE + ONE / 2n, 8, '1', 'en-US')).toBe(
      '1,234.5',
    );
    expect(formatTokens(1_234n * ONE, 8, '1', 'es-PE')).toMatch(
      /^1[,.   ]?234$/,
    );
    expect(formatTokens(ONE / 2n, 8, '1', 'es-PE')).toBe('0.5');
    // A comma-decimal locale, so that path stays covered.
    expect(formatTokens(1_234n * ONE + ONE / 2n, 8, '1', 'de-DE')).toBe(
      '1.234,5',
    );
  });

  it('shows small amounts instead of rounding them to zero', () => {
    expect(formatTokens(5_000_000n, 8, '1', 'en-US')).toBe('0.05');
    expect(formatTokens(1n, 8, '1', 'en-US')).toBe('0.00000001');
    // A vesting amount ticking through 0..1 stays readable; only below 0.01 do digits widen.
    expect(formatTokens(83_333_332n, 8, '1', 'en-US')).toBe('0.8333');
    expect(formatTokens(5_123_456n, 8, '1', 'en-US')).toBe('0.0512');
    expect(formatTokens(123_456n, 8, '1', 'en-US')).toBe('0.00123456');
    expect(formatTokens(0n, 8, '1', 'en-US')).toBe('0');
  });

  it('applies the scaled-UI multiplier', () => {
    // 100.57145602... to four places.
    expect(formatTokens(100n * ONE, 8, '1.005714560286254', 'en-US')).toBe(
      '100.5715',
    );
    expect(
      formatTokens(100n * ONE, 8, '1.005714560286254', 'en-US', {
        rounding: 'down',
      }),
    ).toBe('100.5714');
  });

  it('rounds to nearest by default so derived totals read cleanly', () => {
    // 959.99999999 is unit-conversion noise, not a real 959.9999.
    expect(formatTokens(95_999_999_999n, 8, '1', 'en-US')).toBe('960');
    expect(formatTokens(199_999_999n, 8, '1', 'en-US')).toBe('2');
    expect(formatTokens(123_454_999n, 8, '1', 'en-US')).toBe('1.2345');
    expect(formatTokens(123_455_000n, 8, '1', 'en-US')).toBe('1.2346');
  });

  it('rounds down for a balance so a typed-back value never exceeds what is held', () => {
    const down = { rounding: 'down' } as const;
    expect(formatTokens(199_999_999n, 8, '1', 'en-US', down)).toBe('1.9999');
    expect(formatTokens(95_999_999_999n, 8, '1', 'en-US', down)).toBe(
      '959.9999',
    );
    expect(formatTokens(123_455_000n, 8, '1', 'en-US', down)).toBe('1.2345');
  });

  it('pads to a minimum number of fraction digits for aligned columns', () => {
    expect(
      formatTokens(3n * ONE, 8, '1', 'en-US', { minFractionDigits: 2 }),
    ).toBe('3.00');
    expect(
      formatTokens(ONE / 2n, 8, '1', 'en-US', { minFractionDigits: 2 }),
    ).toBe('0.50');
  });

  it('handles the u64 maximum', () => {
    expect(formatTokens(0xffff_ffff_ffff_ffffn, 8, '1', 'en-US')).toBe(
      '184,467,440,737.0955',
    );
  });
});

describe('isMainnet', () => {
  it('is true only for the real cluster', () => {
    expect(isMainnet('mainnet-beta')).toBe(true);
    expect(isMainnet('mainnet')).toBe(true);
    for (const other of ['devnet', 'localnet', 'testnet', '', 'Mainnet-Beta']) {
      expect(isMainnet(other), other).toBe(false);
    }
  });
});

describe('toIntlLocale', () => {
  it('maps the app locales to the audience formats', () => {
    expect(toIntlLocale('es')).toBe('es-PE');
    expect(toIntlLocale('en')).toBe('en-US');
    expect(toIntlLocale('de-DE')).toBe('de-DE');
  });
});

describe('formatDuration', () => {
  it('picks one readable unit', () => {
    expect(formatDuration(30, 'en-US')).toBe('30 seconds');
    expect(formatDuration(180, 'en-US')).toBe('3 minutes');
    expect(formatDuration(7_200, 'en-US')).toBe('2 hours');
    expect(formatDuration(86_400 * 30, 'en-US')).toBe('30 days');
    expect(formatDuration(86_400 * 180, 'en-US')).toBe('6 months');
    expect(formatDuration(86_400 * 365 * 3, 'en-US')).toBe('3 years');
  });

  it('localizes and never goes negative', () => {
    expect(formatDuration(180, 'es-PE')).toBe('3 minutos');
    expect(formatDuration(-5, 'en-US')).toBe('0 seconds');
  });
});

describe('isDemoTimescale', () => {
  it('flags anything shorter than a week', () => {
    expect(isDemoTimescale(180)).toBe(true);
    expect(isDemoTimescale(6 * 86_400)).toBe(true);
    expect(isDemoTimescale(7 * 86_400)).toBe(false);
    expect(isDemoTimescale(180 * 86_400)).toBe(false);
  });
});

describe('shortAddress and explorerUrl', () => {
  const address = '92EVZikCaJ1SXTJAq7e8NzzZg5zLKjK2LyX14SQeQRfE';

  it('abbreviates only long strings', () => {
    expect(shortAddress(address)).toBe('92EV…QRfE');
    expect(shortAddress('abc')).toBe('abc');
  });

  it('builds a link per cluster and escapes the id', () => {
    expect(explorerUrl('mainnet-beta', 'tx', 'SIG')).toBe(
      'https://explorer.solana.com/tx/SIG',
    );
    expect(explorerUrl('devnet', 'address', address)).toBe(
      `https://explorer.solana.com/address/${address}?cluster=devnet`,
    );
    expect(explorerUrl('localnet', 'tx', 'SIG', 'http://127.0.0.1:8899')).toBe(
      'https://explorer.solana.com/tx/SIG?cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899',
    );
    expect(explorerUrl('mainnet-beta', 'tx', 'a/b?c')).toBe(
      'https://explorer.solana.com/tx/a%2Fb%3Fc',
    );
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-09-20T12:00:00Z');

  it('speaks in the largest sensible unit', () => {
    expect(
      formatRelativeTime(new Date('2026-09-20T11:58:00Z'), now, 'en-US'),
    ).toBe('2 minutes ago');
    expect(
      formatRelativeTime(new Date('2026-09-20T09:00:00Z'), now, 'en-US'),
    ).toBe('3 hours ago');
    expect(
      formatRelativeTime(new Date('2026-09-18T12:00:00Z'), now, 'en-US'),
    ).toBe('2 days ago');
    expect(
      formatRelativeTime(new Date('2026-09-20T11:59:50Z'), now, 'es-PE'),
    ).toContain('10');
  });
});
