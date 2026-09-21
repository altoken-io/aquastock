import { describe, expect, it } from 'vitest';

import { rawToUi } from '@/lib/solana/amounts';

import { previewDepositInput, type DepositContext } from './deposit-preview';

const ONE = 10n ** 8n;
const NOW = 1_800_000_000;

function context(
  over: Partial<DepositContext> = {},
  pool: Partial<DepositContext['pool']> = {},
): DepositContext {
  return {
    pool: {
      endsAt: NOW + 3_600,
      perSaverCap: (100n * ONE).toString(),
      matchBps: 10_000,
      unreserved: (500n * ONE).toString(),
      ...pool,
    },
    decimals: 8,
    multiplier: '1',
    balanceRaw: 1_000n * ONE,
    paused: false,
    transferHookEnabled: false,
    now: NOW,
    ...over,
  };
}

describe('previewDepositInput', () => {
  it('is empty until something is typed', () => {
    expect(previewDepositInput('', context())).toEqual({ status: 'empty' });
    expect(previewDepositInput('   ', context())).toEqual({ status: 'empty' });
  });

  it('previews the full match at the pool ratio', () => {
    expect(previewDepositInput('40', context())).toEqual({
      status: 'ok',
      amountRaw: 40n * ONE,
      matchedRaw: 40n * ONE,
      wantedRaw: 40n * ONE,
      partial: false,
    });
    expect(
      previewDepositInput('40', context({}, { matchBps: 5_000 })),
    ).toMatchObject({
      matchedRaw: 20n * ONE,
      wantedRaw: 20n * ONE,
    });
  });

  it('flags a partial match when the budget is short', () => {
    expect(
      previewDepositInput(
        '40',
        context({}, { unreserved: (15n * ONE).toString() }),
      ),
    ).toMatchObject({
      status: 'ok',
      matchedRaw: 15n * ONE,
      wantedRaw: 40n * ONE,
      partial: true,
    });
  });

  it('reports why an input is invalid', () => {
    for (const [input, reason] of [
      ['abc', 'format'],
      ['-5', 'format'],
      ['1e3', 'format'],
      ['1.000000001', 'precision'],
      ['0', 'too-small'],
    ] as const) {
      expect(previewDepositInput(input, context()), input).toEqual({
        status: 'invalid',
        reason,
      });
    }
  });

  it('blocks a deposit over the per-saver cap, and allows exactly the cap', () => {
    expect(previewDepositInput('100.00000001', context())).toEqual({
      status: 'blocked',
      reason: 'over-cap',
      amountRaw: 100n * ONE + 1n,
    });
    expect(previewDepositInput('100', context()).status).toBe('ok');
  });

  it('blocks when the match budget is exhausted', () => {
    expect(
      previewDepositInput('5', context({}, { unreserved: '0' })),
    ).toMatchObject({
      status: 'blocked',
      reason: 'budget-exhausted',
    });
  });

  it('blocks when the wallet cannot cover it, but not while the balance is unknown', () => {
    expect(
      previewDepositInput('40', context({ balanceRaw: 39n * ONE })),
    ).toMatchObject({
      status: 'blocked',
      reason: 'insufficient-balance',
    });
    expect(
      previewDepositInput('40', context({ balanceRaw: 40n * ONE })).status,
    ).toBe('ok');
    expect(
      previewDepositInput('40', context({ balanceRaw: null })).status,
    ).toBe('ok');
  });

  it('blocks everything once the pool has ended, the mint is paused, or a hook is on', () => {
    for (const [over, reason] of [
      [{ now: NOW + 3_600 }, 'ended'],
      [{ paused: true }, 'paused'],
      [{ transferHookEnabled: true }, 'transfer-hook'],
    ] as const) {
      // Even with nothing typed: the panel must say why it cannot be used at all.
      expect(previewDepositInput('', context(over))).toEqual({
        status: 'blocked',
        reason,
        amountRaw: null,
      });
      expect(previewDepositInput('40', context(over))).toEqual({
        status: 'blocked',
        reason,
        amountRaw: null,
      });
    }
  });

  it('converts what is typed through the display multiplier, rounding up so it displays as typed', () => {
    const preview = previewDepositInput(
      '100',
      context({ multiplier: '1.005714560286254' }),
    );
    // 100 / 1.0057... is not a whole number of raw units; the next unit up shows as 100.
    expect(preview).toMatchObject({
      status: 'ok',
      amountRaw: (100n * ONE * 10n ** 15n) / 1_005_714_560_286_254n + 1n,
    });
  });

  it('accepts exactly the balance a wallet displays, never one raw unit more', () => {
    const multiplier = '1.005714560286254';
    const balanceRaw = 5_432_101_234n;
    const displayed = rawToUi(balanceRaw, 8, multiplier);
    expect(
      previewDepositInput(displayed, context({ multiplier, balanceRaw })),
    ).toMatchObject({ status: 'ok', amountRaw: balanceRaw });
  });

  it('follows the program order: cap is checked before the balance', () => {
    expect(
      previewDepositInput('500', context({ balanceRaw: 1n })),
    ).toMatchObject({ reason: 'over-cap' });
  });
});
