'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { buildMetadataMessage } from '@/lib/pools/metadata-message';

import { fetchJson } from '../lib/api-client';
import { classifyTxError } from '../lib/tx-errors';
import { useToken } from '../token-context';
import { invalidatePoolData } from './queries';

export type PublishState =
  | { phase: 'idle' }
  | { phase: 'signing' }
  | { phase: 'saving' }
  | { phase: 'done' }
  | { phase: 'error'; reason: 'cancelled' | 'failed' };

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Publishes a pool's name and description. There are no accounts: the sponsor's wallet signs
 * a message and the server checks that signature against the pool's on-chain sponsor. Signing
 * is free and moves nothing, and not every wallet can do it (`supported`).
 */
export function usePublishMetadata() {
  const { signMessage } = useWallet();
  const { programId } = useToken();
  const queryClient = useQueryClient();
  const [state, setState] = useState<PublishState>({ phase: 'idle' });

  const publish = useCallback(
    async (input: {
      pool: string;
      name: string;
      description: string | null;
    }): Promise<boolean> => {
      if (!signMessage || !programId) return false;
      setState({ phase: 'signing' });
      try {
        const issuedAt = Math.floor(Date.now() / 1_000);
        const message = buildMetadataMessage({
          programId,
          pool: input.pool,
          name: input.name,
          description: input.description,
          issuedAt,
        });
        const signature = await signMessage(new TextEncoder().encode(message));
        setState({ phase: 'saving' });
        await fetchJson(`/api/pools/${input.pool}/metadata`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: input.name,
            ...(input.description === null
              ? {}
              : { description: input.description }),
            issuedAt,
            signature: toBase64(signature),
          }),
        });
        setState({ phase: 'done' });
        invalidatePoolData(queryClient, input.pool);
        return true;
      } catch (error) {
        setState({
          phase: 'error',
          reason:
            classifyTxError(error).kind === 'wallet-rejected'
              ? 'cancelled'
              : 'failed',
        });
        return false;
      }
    },
    [signMessage, programId, queryClient],
  );

  return { state, publish, supported: signMessage !== undefined };
}
