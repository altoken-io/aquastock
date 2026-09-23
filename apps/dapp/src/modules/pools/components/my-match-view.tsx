'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { CloudOff, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import type { MyPositionDto } from '@aquastock/types';

import { Link } from '@/lib/i18n/navigation';
import { WalletButton } from '@/modules/wallet/wallet-button';
import { cn } from '@/utils/classNames';

import { usePositions, useSponsoredPools } from '../hooks/queries';
import { useNow } from '../hooks/use-now';
import { useUsd } from '../hooks/use-price';
import { useMatchPoolsProgram } from '../hooks/use-program';
import { totalPositions, viewPosition } from '../lib/position-view';
import { useFormatters, useToken } from '../token-context';
import { buildClaim } from '../tx/builders';
import { usePoolTransaction } from '../tx/use-pool-transaction';
import { ActionButton, ActionLink } from './actions';
import { PoolCard, PoolCardSkeleton, usePoolName } from './pool-card';
import { StateCard } from './pool-list-view';
import { TxStatus } from './tx-status';

/**
 * Everything one wallet has in Match Pools: what it has deposited and how much of the match has
 * vested, and the pools it sponsors. Read from the chain by wallet address, with no account.
 */
export function MyMatchView({ serverNow }: { serverNow: number }) {
  const t = useTranslations('myMatch');
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const tx = usePoolTransaction();
  const now = useNow(serverNow);
  const positions = usePositions(wallet);
  const sponsored = useSponsoredPools(wallet);

  const rows = useMemo(
    () =>
      (positions.data?.positions ?? []).map((entry) => ({
        entry,
        view: viewPosition(entry.position, entry.pool, now),
      })),
    [positions.data, now],
  );
  const totals = useMemo(
    () => totalPositions(rows.map((row) => row.view)),
    [rows],
  );

  if (wallet === null) {
    return (
      <StateCard
        title={t('connect.title')}
        description={t('connect.description')}
        action={<WalletButton className="h-11 px-4" />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <Summary totals={totals} loading={positions.isPending} />
      <TxStatus state={tx.state} onDismiss={tx.reset} />

      <section aria-labelledby="positions-title">
        <h2 id="positions-title" className="font-display text-xl font-semibold">
          {t('positions.title')}
        </h2>
        <div className="mt-4">
          {positions.isPending ? (
            <div className="grid gap-4 md:grid-cols-2">
              <PoolCardSkeleton />
              <PoolCardSkeleton />
            </div>
          ) : positions.isError && !positions.data ? (
            <StateCard
              icon={
                <CloudOff
                  aria-hidden
                  className="size-6 text-muted-foreground"
                />
              }
              title={t('error.title')}
              description={t('error.description')}
              action={
                <ActionButton
                  variant="secondary"
                  onClick={() => void positions.refetch()}
                >
                  {t('error.retry')}
                </ActionButton>
              }
            />
          ) : rows.length === 0 ? (
            <StateCard
              title={t('positions.empty.title')}
              description={t('positions.empty.description')}
              action={
                <ActionLink href="/pools">
                  {t('positions.empty.cta')}
                </ActionLink>
              }
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {rows.map(({ entry, view }) => (
                <li key={entry.position.address}>
                  <PositionRow
                    entry={entry}
                    view={view}
                    tx={tx}
                    wallet={publicKey}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="sponsored-title">
        <h2 id="sponsored-title" className="font-display text-xl font-semibold">
          {t('sponsored.title')}
        </h2>
        <div className="mt-4">
          {sponsored.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PoolCardSkeleton />
            </div>
          ) : (sponsored.data?.pools.length ?? 0) === 0 ? (
            <StateCard
              title={t('sponsored.empty.title')}
              description={t('sponsored.empty.description')}
              action={
                <ActionLink href="/pools/new">
                  <Plus aria-hidden className="size-4" />
                  {t('sponsored.empty.cta')}
                </ActionLink>
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sponsored.data?.pools.map((pool) => (
                <li key={pool.address}>
                  <PoolCard
                    pool={pool}
                    serverNow={serverNow}
                    headingLevel="h3"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Summary({
  totals,
  loading,
}: {
  totals: ReturnType<typeof totalPositions>;
  loading: boolean;
}) {
  const t = useTranslations('myMatch.summary');
  const f = useFormatters();
  const usd = useUsd();
  const { symbol } = useToken();
  const cells = [
    { key: 'deposited', value: totals.deposited, tone: 'saver' },
    { key: 'reserved', value: totals.matchReserved, tone: 'sponsor' },
    { key: 'claimed', value: totals.claimed, tone: 'plain' },
    { key: 'claimable', value: totals.claimable, tone: 'ok' },
  ] as const;
  return (
    <dl
      aria-label={t('label')}
      className="dapp-console-panel grid grid-cols-2 divide-border/60 max-md:[&>div:nth-child(n+3)]:border-t md:grid-cols-4 md:divide-x"
    >
      {cells.map(({ key, value, tone }) => (
        <div key={key} className="border-border/60 p-4 sm:p-5">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t(key)}
          </dt>
          <dd
            className={cn(
              'font-display mt-1.5 text-2xl font-semibold tabular-nums sm:text-3xl',
              tone === 'ok' && value > 0n && 'text-ok',
              tone === 'saver' && 'text-saver',
              tone === 'sponsor' && 'text-sponsor',
            )}
          >
            {loading ? '—' : f.tokens(value)}
            <span className="ml-1.5 text-xs font-medium text-muted-foreground">
              {symbol}
            </span>
            {loading ? null : (
              <span className="mt-0.5 block font-sans text-xs font-normal text-muted-foreground">
                {usd(value)}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PositionRow({
  entry,
  view,
  tx,
  wallet,
}: {
  entry: MyPositionDto;
  view: ReturnType<typeof viewPosition>;
  tx: ReturnType<typeof usePoolTransaction>;
  wallet: PublicKey | null;
}) {
  const t = useTranslations('myMatch.row');
  const tStatus = useTranslations('position.status');
  const f = useFormatters();
  const usd = useUsd();
  const token = useToken();
  const program = useMatchPoolsProgram();
  const name = usePoolName(entry.pool);
  const percent = f.fraction(view.fraction);

  const claim = () => {
    if (!wallet || !program || !token.mint) return;
    const mint = new PublicKey(token.mint);
    void tx.run(
      'claim',
      () =>
        buildClaim({
          program,
          pool: new PublicKey(entry.pool.address),
          mint,
          saver: wallet,
        }),
      { poolAddress: entry.pool.address },
    );
  };

  return (
    <article className="dapp-console-panel flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display min-w-0 text-lg font-semibold text-balance">
          <Link
            href={`/pools/${entry.pool.address}`}
            className="outline-none hover:underline focus-visible:underline"
          >
            {name}
          </Link>
        </h3>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium">
          <span
            aria-hidden
            className={cn(
              'size-1.5 rounded-full',
              view.status === 'vesting'
                ? 'bg-primary motion-safe:animate-pulse'
                : 'bg-ok',
            )}
          />
          {tStatus(view.status)}
        </span>
      </div>

      <div>
        <div
          role="progressbar"
          aria-label={t('progress', { percent })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(view.fraction * 100)}
          className="h-2 overflow-hidden rounded-full bg-border/70"
        >
          <div
            className="h-full rounded-full bg-ok transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${view.fraction * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
          {t('vested', {
            vested: f.tokens(view.vested),
            reserved: f.tokens(view.state.matchReserved),
          })}
        </p>
      </div>

      <dl className="text-sm">
        {view.state.settled ? null : (
          <Row
            label={t('deposit')}
            value={`${f.tokens(view.state.deposited)} ${token.symbol}`}
          />
        )}
        <Row
          label={t('match')}
          value={`${f.tokens(view.state.matchReserved)} ${token.symbol}`}
          usd={usd(view.state.matchReserved)}
        />
        <Row
          label={t('claimable')}
          value={`${f.tokens(view.claimable)} ${token.symbol}`}
          strong
          usd={usd(view.claimable)}
        />
      </dl>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <ActionButton
          disabled={view.claimable === 0n || tx.busy || !program}
          onClick={claim}
        >
          {t('claim', {
            amount: f.tokens(view.claimable),
            symbol: token.symbol,
          })}
        </ActionButton>
        <ActionLink href={`/pools/${entry.pool.address}`} variant="secondary">
          {t('open')}
        </ActionLink>
      </div>
    </article>
  );
}

function Row({
  label,
  value,
  strong,
  usd,
}: {
  label: string;
  value: string;
  strong?: boolean;
  usd?: string | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn('text-right tabular-nums', strong ? 'font-semibold' : '')}
      >
        {value}
        {usd ? (
          <span className="block text-xs font-normal text-muted-foreground">
            {usd}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
