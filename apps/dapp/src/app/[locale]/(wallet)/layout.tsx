import type { ReactNode } from 'react';

import { SolanaProvider } from '@/providers/solana-provider';

/**
 * Only the pages that talk to a wallet pay for the wallet stack (web3.js, Anchor, the wallet
 * adapter). The admin sign-in and dashboard, which never touch a wallet, stay light. A route
 * group, so it adds nothing to the URL.
 */
export default function WalletLayout({ children }: { children: ReactNode }) {
  return <SolanaProvider>{children}</SolanaProvider>;
}
