// Wires the real chain client and database into the service. Import this only from route
// handlers and server components; it is the one place that touches the environment.
import prisma from '@aquastock/db-prisma';

import { createChainClient } from './chain';
import { loadPoolsConfig } from './config';
import { createChainReader } from './reader';
import type { PoolServiceDeps } from './service';
import { createPrismaPoolStore } from './store';

let cached: PoolServiceDeps | undefined;

export function getPoolServices(): PoolServiceDeps {
  if (!cached) {
    const config = loadPoolsConfig();
    cached = {
      chain: createChainReader(
        createChainClient(config.rpcUrl, config.programId),
      ),
      store: createPrismaPoolStore(prisma),
      now: () => Math.floor(Date.now() / 1000),
      network: config.network,
      stockMint: config.stockMint,
    };
  }
  return cached;
}
