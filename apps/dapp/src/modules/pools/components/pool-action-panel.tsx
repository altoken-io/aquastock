'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslations } from 'next-intl';

import type { PoolDto, PositionDto } from '@aquastock/types';

import { WalletButton } from '@/modules/wallet/wallet-button';

import { usePoolTransaction } from '../tx/use-pool-transaction';
import { DepositPanel } from './deposit-panel';
import { PositionPanel } from './position-panel';
import { SponsorPanel } from './sponsor-panel';
import { TxStatus } from './tx-status';

/**
 * What a person can do in this pool depends on who they are: connect, deposit, manage their
 * position, or (for the sponsor) fund and reclaim. One transaction runs at a time and its
 * status lives here, so it survives the panel swapping from "deposit" to "your position".
 */
export function PoolActionPanel({
  pool,
  position,
  serverNow,
}: {
  pool: PoolDto;
  position: PositionDto | null;
  serverNow: number;
}) {
  const t = useTranslations('wallet.prompt');
  const tDetail = useTranslations('pools.detail');
  const { publicKey } = useWallet();
  const tx = usePoolTransaction();
  const wallet = publicKey?.toBase58() ?? null;
  // What the panel offers changes with who is looking; each change swaps in with a short fade.
  const mode =
    wallet === null
      ? 'connect'
      : wallet === pool.sponsor
        ? 'sponsor'
        : position
          ? 'position'
          : 'deposit';

  return (
    <aside
      className="dapp-console-panel flex flex-col gap-4 p-5 sm:p-6 lg:sticky lg:top-24"
      aria-label={tDetail('actionsLabel')}
    >
      <div key={mode} className="dapp-enter flex flex-col gap-4">
        {wallet === null ? (
          <>
            <h2 className="text-base font-semibold">{t('title')}</h2>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
            <div>
              <WalletButton className="h-11 px-4" />
            </div>
          </>
        ) : wallet === pool.sponsor ? (
          <SponsorPanel pool={pool} serverNow={serverNow} tx={tx} />
        ) : position ? (
          <PositionPanel
            pool={pool}
            position={position}
            serverNow={serverNow}
            tx={tx}
          />
        ) : (
          <DepositPanel pool={pool} serverNow={serverNow} tx={tx} />
        )}
      </div>
      <TxStatus state={tx.state} onDismiss={tx.reset} />
    </aside>
  );
}
