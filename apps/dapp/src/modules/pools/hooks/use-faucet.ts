'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { FaucetDripDto } from '@aquastock/types';

import { fetchJson } from '../lib/api-client';

/** Asks the demo faucet to top up a wallet, then refreshes every balance on screen. */
export function useFaucet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (wallet: string) =>
      fetchJson<FaucetDripDto>('/api/faucet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wallet }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['balance'] }),
  });
}
