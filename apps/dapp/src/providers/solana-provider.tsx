'use client';

import type { Adapter } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { env } from '@/lib/env/client';

const RPC_URL =
  env('NEXT_PUBLIC_SOLANA_RPC_URL', true) ?? 'http://127.0.0.1:8899';
const NETWORK = env('NEXT_PUBLIC_SOLANA_NETWORK', true) ?? 'localnet';

/**
 * The test wallet, only when a throwaway secret is provided AND the app points at a local
 * validator. `next.config.ts` inlines the secret as an empty string in every other build, so
 * the dynamic import below is dead code there and the adapter never reaches the bundle.
 */
function useTestWallets(): Adapter[] {
  const [wallets, setWallets] = useState<Adapter[]>([]);
  useEffect(() => {
    const secret = process.env.NEXT_PUBLIC_E2E_WALLET_SECRET;
    if (!secret || NETWORK !== 'localnet') return;
    let cancelled = false;
    void import('@/modules/wallet/e2e-wallet-adapter').then(
      ({ E2eWalletAdapter, parseSecretKey }) => {
        const key = parseSecretKey(secret);
        if (key && !cancelled) setWallets([new E2eWalletAdapter(key)]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return wallets;
}

/**
 * Wallet Standard wallets (Phantom, Solflare, Backpack, ...) are detected automatically by
 * `WalletProvider`, so the list of adapters here is empty in production.
 */
export function SolanaProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('wallet');
  const wallets = useTestWallets();
  const onError = useMemo(
    () => () => {
      toast.error(t('connectFailed'));
    },
    [t],
  );

  return (
    <ConnectionProvider endpoint={RPC_URL} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
