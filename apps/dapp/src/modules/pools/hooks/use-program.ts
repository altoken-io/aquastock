'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

import { env } from '@/lib/env/client';
import {
  createMatchPoolsProgram,
  type MatchPoolsProgram,
} from '@/lib/solana/program';

import { useToken } from '../token-context';

/**
 * The Match Pools client, used only to assemble instructions (the wallet signs and sends).
 * The program id is what the server read from the deployment, falling back to the build's env.
 */
export function useMatchPoolsProgram(): MatchPoolsProgram | null {
  const { connection } = useConnection();
  const { programId } = useToken();
  const id = programId ?? env('NEXT_PUBLIC_ANCHOR_PROGRAM_ID', true);
  return useMemo(() => {
    if (!id) return null;
    try {
      return createMatchPoolsProgram({ connection }, new PublicKey(id));
    } catch {
      return null;
    }
  }, [connection, id]);
}
