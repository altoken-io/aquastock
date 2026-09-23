// The demo faucet's terms and its on/off switch. It only ever runs on a demo network, and
// only when a dedicated faucet wallet is configured.
import { Keypair } from '@solana/web3.js';

import type { FaucetInfoDto } from '@aquastock/types';

/** Tokens per request, as a wallet shows them (the display multiplier applies). */
export const DRIP_TOKENS = '100';
/** SOL per request: enough for the account rent and fees of a whole demo run. */
export const DRIP_LAMPORTS = 20_000_000n;
/** A wallet below this much SOL gets the SOL part of a drip. */
export const LOW_SOL_LAMPORTS = 10_000_000n;
/** The faucet keeps this much SOL back for its own fees and the recipient's token account. */
export const FAUCET_SOL_RESERVE_LAMPORTS = 5_000_000n;

const LAMPORTS_PER_SOL = 1_000_000_000n;

/** Networks where tokens are worthless by construction. Mainnet is never on this list. */
const FAUCET_NETWORKS: ReadonlySet<string> = new Set(['devnet', 'localnet']);

export function isFaucetNetwork(network: string): boolean {
  return FAUCET_NETWORKS.has(network);
}

function isSecretKey(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === 64 &&
    value.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
  );
}

/**
 * Reads a keypair from the JSON array a Solana keypair file holds. Returns null for anything
 * else, and never echoes the value, so a malformed secret cannot end up in a log.
 */
export function parseFaucetSecret(value: string | undefined): Keypair | null {
  if (!value) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!isSecretKey(parsed)) return null;
  try {
    return Keypair.fromSecretKey(Uint8Array.from(parsed));
  } catch {
    return null;
  }
}

export function lamportsToSol(lamports: bigint): string {
  const whole = lamports / LAMPORTS_PER_SOL;
  const fraction = (lamports % LAMPORTS_PER_SOL)
    .toString()
    .padStart(9, '0')
    .replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export const FAUCET_INFO: FaucetInfoDto = {
  tokens: DRIP_TOKENS,
  sol: lamportsToSol(DRIP_LAMPORTS),
};
