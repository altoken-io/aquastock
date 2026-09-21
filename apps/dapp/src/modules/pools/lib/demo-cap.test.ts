import { describe, expect, it } from 'vitest';

import { resolveDemoCap } from './demo-cap';

const ONE = 10n ** 8n;

describe('resolveDemoCap', () => {
  it('leaves every non-mainnet network uncapped, whatever is configured', () => {
    for (const network of ['localnet', 'devnet', 'testnet']) {
      expect(resolveDemoCap(network, undefined, 8, '1')).toEqual({
        demoCapRaw: null,
        demoCapMissing: false,
      });
      expect(resolveDemoCap(network, '5', 8, '1').demoCapRaw).toBeNull();
    }
  });

  it('caps mainnet at the configured token amount, through the multiplier', () => {
    expect(resolveDemoCap('mainnet-beta', '10', 8, '1')).toEqual({
      demoCapRaw: 10n * ONE,
      demoCapMissing: false,
    });
    // Rounded down, so the cap can never be exceeded by a typed amount that rounds up.
    const capped = resolveDemoCap('mainnet-beta', '10', 8, '1.005714560286254');
    expect(capped.demoCapRaw).toBe(
      (10n * ONE * 10n ** 15n) / 1_005_714_560_286_254n,
    );
  });

  it('fails closed on mainnet when the cap is missing or unreadable', () => {
    for (const bad of [undefined, '', '   ', 'ten', '-1', '0', '1e3', '1,5']) {
      expect(resolveDemoCap('mainnet-beta', bad, 8, '1'), String(bad)).toEqual({
        demoCapRaw: null,
        demoCapMissing: true,
      });
    }
  });
});
