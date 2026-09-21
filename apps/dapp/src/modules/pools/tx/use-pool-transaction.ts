'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useQueryClient } from '@tanstack/react-query';
import type { TransactionInstruction } from '@solana/web3.js';
import { useCallback, useRef, useState } from 'react';

import { fetchJson } from '../lib/api-client';
import { classifyTxError, type TxErrorInfo } from '../lib/tx-errors';
import { invalidatePoolData } from '../hooks/queries';
import { sendInstructions } from './send';

export type TxAction =
  'deposit' | 'claim' | 'withdraw' | 'close' | 'fund' | 'reclaim' | 'create';

export type TxState =
  | { phase: 'idle' }
  | { phase: 'signing'; action: TxAction }
  | { phase: 'confirming'; action: TxAction; signature: string }
  | { phase: 'done'; action: TxAction; signature: string }
  | { phase: 'error'; action: TxAction; error: TxErrorInfo };

export type PoolTx = ReturnType<typeof usePoolTransaction>;

const RECORD_ATTEMPTS = 3;
const RECORD_DELAY_MS = 1_200;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Asks the server to record the transaction's events. The server re-reads the transaction from
 * the chain, so a node that has not seen it yet answers "not found"; retry briefly. Failing
 * here never fails the action: the chain already has the result, only the feed would lag.
 */
async function recordActivity(signature: string): Promise<void> {
  for (let attempt = 1; attempt <= RECORD_ATTEMPTS; attempt += 1) {
    try {
      await fetchJson('/api/activity', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signature }),
      });
      return;
    } catch {
      if (attempt < RECORD_ATTEMPTS) await sleep(RECORD_DELAY_MS);
    }
  }
}

/**
 * Runs one wallet-signed action at a time and reports where it is: waiting for the wallet,
 * confirming, done, or failed with something a person can act on. Afterwards it refreshes
 * every query the transaction could have changed.
 */
export function usePoolTransaction() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const [state, setState] = useState<TxState>({ phase: 'idle' });
  const running = useRef(false);

  const run = useCallback(
    async (
      action: TxAction,
      build: () => Promise<TransactionInstruction[]>,
      options: { poolAddress?: string } = {},
    ): Promise<string | null> => {
      // A double click must not send two transactions.
      if (running.current) return null;
      running.current = true;
      setState({ phase: 'signing', action });
      try {
        const instructions = await build();
        const signature = await sendInstructions({
          connection,
          wallet,
          instructions,
          onSent: (sent) =>
            setState({ phase: 'confirming', action, signature: sent }),
        });
        setState({ phase: 'done', action, signature });
        // Show the new state at once, then again once the feed has caught up.
        invalidatePoolData(queryClient, options.poolAddress);
        void recordActivity(signature).then(() =>
          invalidatePoolData(queryClient, options.poolAddress),
        );
        return signature;
      } catch (error) {
        setState({ phase: 'error', action, error: classifyTxError(error) });
        return null;
      } finally {
        running.current = false;
      }
    },
    [connection, wallet, queryClient],
  );

  const reset = useCallback(() => setState({ phase: 'idle' }), []);

  return {
    state,
    run,
    reset,
    busy: state.phase === 'signing' || state.phase === 'confirming',
  };
}
