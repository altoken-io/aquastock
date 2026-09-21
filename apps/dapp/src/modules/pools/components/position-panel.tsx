'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import type { PoolDto, PositionDto } from '@aquastock/types';

import { previewWithdraw } from '@/lib/pools/vesting';

import { useNow } from '../hooks/use-now';
import { useMatchPoolsProgram } from '../hooks/use-program';
import { formatDuration, toIntlLocale } from '../lib/format';
import { viewPosition } from '../lib/position-view';
import { useFormatters, useToken } from '../token-context';
import { buildClaim, buildClosePosition, buildWithdraw } from '../tx/builders';
import type { PoolTx } from '../tx/use-pool-transaction';
import { ActionButton } from './actions';
import { ConfirmDialog } from './confirm-dialog';
import { MatchRing } from './match-ring';
import { Notice } from './notice';
import { LedgerRow } from './stream-legend';

/**
 * The saver's side of the Confluence: their savings and the sponsor's match as one ring, the
 * bezel filling as the match vests. Vested figures come from the program's own schedule maths
 * (the chain pays whatever it decides at the moment of the claim); claimed comes only from the
 * position account, so nothing shows as paid until the chain says so.
 */
export function PositionPanel({
  pool,
  position,
  serverNow,
  tx,
}: {
  pool: PoolDto;
  position: PositionDto;
  serverNow: number;
  tx: PoolTx;
}) {
  const t = useTranslations('position');
  const token = useToken();
  const f = useFormatters();
  const locale = toIntlLocale(useLocale());
  const { publicKey } = useWallet();
  const program = useMatchPoolsProgram();
  const now = useNow(serverNow);
  const [confirming, setConfirming] = useState(false);

  const view = useMemo(
    () => viewPosition(position, pool, now),
    [position, pool, now],
  );
  const { state, vested, claimable, allClaimed, status, canClose } = view;
  const withdraw = previewWithdraw(state, pool.vestingSeconds, now);
  // What is still to claim after leaving: vested match minus what has already been paid.
  const stillClaimable =
    withdraw.keptVested > state.matchClaimed
      ? withdraw.keptVested - state.matchClaimed
      : 0n;

  const symbol = token.symbol;
  const amount = (raw: bigint) => `${f.tokens(raw)} ${symbol}`;

  const context = () => {
    if (!publicKey || !program || !token.mint) return null;
    return {
      program,
      pool: new PublicKey(pool.address),
      mint: new PublicKey(token.mint),
      saver: publicKey,
    };
  };
  const run = (
    action: 'claim' | 'withdraw' | 'close',
    build: (
      c: NonNullable<ReturnType<typeof context>>,
    ) => ReturnType<typeof buildClaim>,
  ) => {
    const c = context();
    if (!c) return;
    void tx.run(action, () => build(c), { poolAddress: pool.address });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">{t('title')}</h2>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium">
          <span
            aria-hidden
            className={
              status === 'vesting'
                ? 'size-1.5 rounded-full bg-primary motion-safe:animate-pulse'
                : 'size-1.5 rounded-full bg-ok'
            }
          />
          {t(`status.${status}`)}
        </span>
      </div>

      <div className="flex justify-center">
        <MatchRing
          animateIn
          size={216}
          strokeWidth={16}
          progress={view.fraction}
          segments={[
            { token: 'sponsor', value: Number(state.matchReserved) },
            { token: 'saver', value: Number(state.deposited) },
          ]}
          label={t('ring.label', {
            vested: f.tokens(vested),
            reserved: f.tokens(state.matchReserved),
            symbol,
          })}
        >
          <span className="font-display text-3xl leading-none font-semibold tabular-nums">
            {f.tokens(vested)}
          </span>
          <span className="mt-1 text-xs font-medium text-muted-foreground">
            {symbol}
          </span>
          <span className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {t('ring.unit', { reserved: f.tokens(state.matchReserved) })}
          </span>
        </MatchRing>
      </div>

      <dl>
        {position.settled ? null : (
          <LedgerRow
            stream="saver"
            label={t('ledger.deposit')}
            value={amount(state.deposited)}
          />
        )}
        <LedgerRow
          stream="sponsor"
          label={t('ledger.match')}
          value={amount(state.matchReserved)}
        />
        <LedgerRow label={t('ledger.vested')} value={amount(vested)} />
        <LedgerRow
          label={t('ledger.claimed')}
          value={amount(state.matchClaimed)}
        />
        <LedgerRow
          label={t('ledger.claimable')}
          value={amount(claimable)}
          emphasis
        />
      </dl>

      {position.settled ? (
        allClaimed ? null : (
          <Notice>{t('withdrawn')}</Notice>
        )
      ) : (
        <p className="text-xs text-muted-foreground">
          {t('schedule', {
            duration: formatDuration(pool.vestingSeconds, locale),
            date: f.dateTime(position.startedAt),
          })}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {canClose ? (
          <>
            <ActionButton
              className="h-11 w-full"
              disabled={tx.busy}
              onClick={() => run('close', buildClosePosition)}
            >
              {t('actions.close')}
            </ActionButton>
            <p className="text-xs text-muted-foreground">
              {t('actions.closeHint')}
            </p>
          </>
        ) : (
          <ActionButton
            className="h-11 w-full"
            disabled={claimable === 0n || tx.busy}
            onClick={() => run('claim', buildClaim)}
          >
            {claimable > 0n
              ? t('actions.claim', { amount: f.tokens(claimable), symbol })
              : t('actions.claimNothing')}
          </ActionButton>
        )}
        {position.settled ? null : (
          <ActionButton
            variant="secondary"
            className="h-11 w-full"
            disabled={tx.busy}
            onClick={() => setConfirming(true)}
          >
            {t('actions.withdraw')}
          </ActionButton>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t('confirm.title')}
      >
        <dl className="mt-3">
          <LedgerRow
            stream="saver"
            label={t('confirm.returns')}
            value={amount(withdraw.principal)}
            emphasis
          />
          <LedgerRow
            label={t('confirm.keeps')}
            value={amount(stillClaimable)}
          />
          <LedgerRow
            stream="sponsor"
            label={t('confirm.forfeits')}
            value={amount(withdraw.forfeited)}
          />
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          {withdraw.forfeited > 0n
            ? t('confirm.forfeitsHint')
            : t('confirm.nothingForfeited')}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ActionButton variant="ghost" onClick={() => setConfirming(false)}>
            {t('confirm.cancel')}
          </ActionButton>
          <ActionButton
            variant="danger"
            disabled={tx.busy}
            onClick={() => {
              setConfirming(false);
              run('withdraw', buildWithdraw);
            }}
          >
            {t('confirm.confirm', {
              amount: f.tokens(withdraw.principal),
              symbol,
            })}
          </ActionButton>
        </div>
      </ConfirmDialog>
    </div>
  );
}
