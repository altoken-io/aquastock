// Deployment configuration for the pools server code, read through `lib/env`.
import { PublicKey } from '@solana/web3.js';

import { env as clientEnv } from '@/lib/env/client';
import { optionalServerEnv } from '@/lib/env/server';

import { isValidAddress } from './schemas';

export interface PoolsConfig {
  programId: PublicKey;
  rpcUrl: string;
  network: string;
  /** The mint this deployment is meant to use, if configured. */
  stockMint: PublicKey | null;
}

function parseAddress(name: string, value: string | undefined): PublicKey {
  if (!value || !isValidAddress(value)) {
    throw new Error(`${name} is missing or is not a valid Solana address`);
  }
  return new PublicKey(value);
}

export function loadPoolsConfig(): PoolsConfig {
  const programId = parseAddress(
    'NEXT_PUBLIC_ANCHOR_PROGRAM_ID',
    clientEnv('NEXT_PUBLIC_ANCHOR_PROGRAM_ID', true),
  );

  const rpcUrl =
    optionalServerEnv('SOLANA_RPC_URL') ??
    clientEnv('NEXT_PUBLIC_SOLANA_RPC_URL', true) ??
    (process.env.NODE_ENV === 'production'
      ? undefined
      : 'http://127.0.0.1:8899');
  if (!rpcUrl) {
    throw new Error('SOLANA_RPC_URL is not set');
  }

  const mint = clientEnv('NEXT_PUBLIC_STOCK_MINT', true);
  return {
    programId,
    rpcUrl,
    network: clientEnv('NEXT_PUBLIC_SOLANA_NETWORK', true) ?? 'localnet',
    stockMint: mint ? parseAddress('NEXT_PUBLIC_STOCK_MINT', mint) : null,
  };
}
