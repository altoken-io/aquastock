// The narrow surface the service needs from the chain. The real implementation wraps the
// Anchor client; tests supply plain fakes, so the service never depends on RPC details.
import type { PublicKey } from '@solana/web3.js';

import { positionPda } from '../solana/pdas';
import { fetchTransactionEvents, type PoolEvents } from './activity';
import {
  fetchDeployment,
  fetchPool,
  fetchPools,
  fetchPositionForWallet,
  fetchPositionsForWallet,
  type ChainClient,
  type ChainDeployment,
  type ChainPool,
  type ChainPosition,
} from './chain';

export interface ChainReader {
  programId: PublicKey;
  pools(): Promise<ChainPool[]>;
  pool(address: PublicKey): Promise<ChainPool | null>;
  positionsFor(wallet: PublicKey): Promise<ChainPosition[]>;
  position(pool: PublicKey, saver: PublicKey): Promise<ChainPosition | null>;
  deployment(
    network: string,
    fallbackMint: PublicKey | null,
    now: number,
  ): Promise<ChainDeployment>;
  transactionEvents(signature: string): Promise<PoolEvents[]>;
}

export function createChainReader(client: ChainClient): ChainReader {
  return {
    programId: client.programId,
    pools: () => fetchPools(client),
    pool: (address) => fetchPool(client, address),
    positionsFor: (wallet) => fetchPositionsForWallet(client, wallet),
    position: (pool, saver) =>
      fetchPositionForWallet(
        client,
        pool,
        positionPda(client.programId, pool, saver),
      ),
    deployment: (network, fallbackMint, now) =>
      fetchDeployment(client, network, fallbackMint, now),
    transactionEvents: (signature) => fetchTransactionEvents(client, signature),
  };
}
