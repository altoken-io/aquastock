// Wires the faucet to the real network and limiters. Import only from route handlers and
// server code. Null means this deployment runs no faucet.
import { Connection } from '@solana/web3.js';

import { optionalServerEnv } from '@/lib/env/server';
import { createRateLimiter } from '@/lib/rate-limit';

import { loadPoolsConfig } from '../pools/config';
import { createFaucetChain } from './chain';
import { isFaucetNetwork, parseFaucetSecret } from './config';
import type { FaucetDeps } from './service';

const HOUR = 3_600;

let cached: FaucetDeps | null | undefined;

export function getFaucetServices(): FaucetDeps | null {
  if (cached !== undefined) return cached;

  const config = loadPoolsConfig();
  const secret = optionalServerEnv('FAUCET_SECRET_KEY');
  const faucet = parseFaucetSecret(secret);
  if (secret && !faucet) {
    // Never print the value: say only that it is not a keypair.
    console.error(
      'FAUCET_SECRET_KEY is set but is not a keypair JSON array; the faucet is off',
    );
  }
  cached =
    faucet && config.stockMint && isFaucetNetwork(config.network)
      ? {
          chain: createFaucetChain(
            new Connection(config.rpcUrl, 'confirmed'),
            faucet,
            config.stockMint,
          ),
          faucet: faucet.publicKey,
          limiters: {
            wallet: createRateLimiter({
              prefix: 'faucet-wallet',
              requests: 3,
              windowSeconds: 24 * HOUR,
            }),
            // A day, not an hour: new keypairs are free, so per-IP is the limit that matters.
            ip: createRateLimiter({
              prefix: 'faucet-ip-day',
              requests: 10,
              windowSeconds: 24 * HOUR,
            }),
            global: createRateLimiter({
              prefix: 'faucet-all',
              requests: 500,
              windowSeconds: 24 * HOUR,
            }),
          },
        }
      : null;
  return cached;
}
