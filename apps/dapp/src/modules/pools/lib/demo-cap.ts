import { AmountError, uiToRaw } from '@/lib/solana/amounts';

import { isMainnet } from './format';

export interface DemoCap {
  /** Largest pool budget or per-saver limit, in raw units. Null means uncapped. */
  demoCapRaw: bigint | null;
  /** Creation must stay closed: real money, and nobody set a limit. */
  demoCapMissing: boolean;
}

/**
 * The hackathon build must not be able to lock real money it cannot afford to lose, so on
 * mainnet a pool's size is limited to `NEXT_PUBLIC_MAINNET_DEMO_CAP` (in token units). If that is
 * unset or unreadable on mainnet, creation is closed rather than left unlimited. Everywhere
 * else there is no limit.
 *
 * This is a guard in the interface, not a control in the program: anyone can still call the
 * program directly. It stops a person clicking through by accident, and the docs say so.
 */
export function resolveDemoCap(
  network: string,
  configured: string | undefined,
  decimals: number,
  multiplier: string,
): DemoCap {
  if (!isMainnet(network)) return { demoCapRaw: null, demoCapMissing: false };
  const text = configured?.trim();
  if (!text) return { demoCapRaw: null, demoCapMissing: true };
  try {
    return {
      demoCapRaw: uiToRaw(text, decimals, multiplier, 'down'),
      demoCapMissing: false,
    };
  } catch (error) {
    if (error instanceof AmountError) {
      return { demoCapRaw: null, demoCapMissing: true };
    }
    throw error;
  }
}
