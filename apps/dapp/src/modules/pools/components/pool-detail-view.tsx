'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/lib/i18n/navigation';

import { usePoolDetail, type PoolDetailData } from '../hooks/queries';
import { useNow } from '../hooks/use-now';
import {
  formatDuration,
  isDemoTimescale,
  shortAddress,
  toIntlLocale,
} from '../lib/format';
import { poolPhase, secondsLeft } from '../lib/pool-status';
import { useFormatters, useToken } from '../token-context';
import { ActionButton } from './actions';
import { ActivityFeed } from './activity-feed';
import { IssuerCard } from './issuer-card';
import { MatchRing } from './match-ring';
import { DemoTimescaleBadge, PhaseBadge } from './pool-badges';
import { usePoolName } from './pool-card';
import { PoolActionPanel } from './pool-action-panel';
import { StateCard } from './pool-list-view';
import { LedgerRow, StreamTag } from './stream-legend';

export function PoolDetailView({
  address,
  initial,
  serverNow,
}: {
  address: string;
  /** Null when the server could not read the chain; the browser then tries for itself. */
  initial: PoolDetailData | null;
  serverNow: number;
}) {
  const t = useTranslations('pools');
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const query = usePoolDetail(address, wallet, initial ?? undefined);

  if (query.isPending) return <DetailSkeleton />;
  if (!query.data) {
    return (
      <StateCard
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        action={
          <ActionButton
            variant="secondary"
            onClick={() => void query.refetch()}
          >
            {t('states.retry')}
          </ActionButton>
        }
      />
    );
  }
  return (
    <Loaded
      address={address}
      data={query.data}
      serverNow={serverNow}
      wallet={wallet}
    />
  );
}

function Loaded({
  address,
  data,
  serverNow,
  wallet,
}: {
  address: string;
  data: PoolDetailData;
  serverNow: number;
  wallet: string | null;
}) {
  const t = useTranslations('pools.detail');
  const tRules = useTranslations('pools.detail.rules');
  const tDemo = useTranslations('pools.demo');
  const locale = toIntlLocale(useLocale());
  const f = useFormatters();
  const { symbol } = useToken();
  const now = useNow(serverNow);
  const { pool } = data;
  const name = usePoolName(pool);

  const phase = poolPhase(pool, now);
  const left = secondsLeft(pool, now);
  const isSponsor = wallet === pool.sponsor;
  const demo = isDemoTimescale(pool.vestingSeconds);
  const total = BigInt(pool.budgetTotal);
  const reserved = BigInt(pool.reserved);
  const reservedShare =
    total > 0n ? Number((reserved * 10_000n) / total) / 10_000 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-8">
      <header className="lg:col-span-2">
        <Link
          href="/pools"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t('back')}
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PhaseBadge phase={phase} />
          {demo ? <DemoTimescaleBadge /> : null}
          {isSponsor ? (
            <StreamTag stream="sponsor">{t('you')}</StreamTag>
          ) : null}
        </div>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {name}
        </h1>
        {pool.metadata?.description ? (
          <p className="mt-2 max-w-2xl text-base whitespace-pre-line text-muted-foreground">
            {pool.metadata.description}
          </p>
        ) : null}
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            {t('sponsor')}{' '}
            <span className="tabular-nums text-foreground">
              {shortAddress(pool.sponsor)}
            </span>
          </span>
          <a
            href={f.explorer('address', pool.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
          >
            {t('explorer')}
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        </p>
        {demo ? (
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {tDemo('note', {
              duration: formatDuration(pool.vestingSeconds, locale),
            })}
          </p>
        ) : null}
      </header>

      <section
        aria-labelledby="instrument-title"
        className="dapp-console-panel flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-center sm:p-6"
      >
        <MatchRing
          animateIn
          size={232}
          strokeWidth={18}
          segments={[{ token: 'sponsor', value: reservedShare }]}
          capacity={total > 0n ? 1 : undefined}
          label={t('instrument.ringLabel', {
            reserved: f.tokens(pool.reserved),
            total: f.tokens(pool.budgetTotal),
            symbol,
          })}
        >
          <span className="font-display text-3xl font-semibold tabular-nums leading-none">
            {f.tokens(pool.unreserved)}
          </span>
          <span className="mt-1 text-xs font-medium text-muted-foreground">
            {symbol}
          </span>
          <span className="mt-0.5 text-xs text-muted-foreground">
            {t('instrument.left')}
          </span>
        </MatchRing>
        <div className="w-full min-w-0 flex-1">
          <h2 id="instrument-title" className="text-base font-semibold">
            {t('instrument.title')}
          </h2>
          <dl className="mt-2">
            <LedgerRow
              stream="sponsor"
              label={t('instrument.ledger.total')}
              value={`${f.tokens(pool.budgetTotal)} ${symbol}`}
              emphasis
            />
            <LedgerRow
              stream="sponsor"
              label={t('instrument.ledger.reserved')}
              value={`${f.tokens(pool.reserved)} ${symbol}`}
            />
            <LedgerRow
              label={t('instrument.ledger.available')}
              value={`${f.tokens(pool.unreserved)} ${symbol}`}
            />
            <LedgerRow
              stream="saver"
              label={t('instrument.ledger.deposits')}
              value={`${f.tokens(pool.depositsTotal)} ${symbol}`}
            />
            <LedgerRow
              label={t('instrument.ledger.claimed')}
              value={`${f.tokens(pool.claimed)} ${symbol}`}
            />
          </dl>
        </div>
      </section>

      <div className="lg:row-span-2">
        <PoolActionPanel
          pool={pool}
          position={data.position}
          serverNow={serverNow}
        />
      </div>

      <section
        className="dapp-console-panel p-5 sm:p-6"
        aria-labelledby="rules-title"
      >
        <h2 id="rules-title" className="text-base font-semibold">
          {tRules('title')}
        </h2>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted-foreground">
          <li>{tRules('match', { percent: f.percent(pool.matchBps) })}</li>
          <li>
            {tRules('cap', { amount: f.tokens(pool.perSaverCap), symbol })}
          </li>
          <li>
            {tRules('vesting', {
              duration: formatDuration(pool.vestingSeconds, locale),
            })}
          </li>
          <li>
            {left > 0
              ? tRules('closesIn', { duration: formatDuration(left, locale) })
              : tRules('closedOn', { date: f.dateTime(pool.endsAt) })}
          </li>
          <li>{tRules('leaveEarly')}</li>
          <li>{tRules('reclaim')}</li>
        </ul>
      </section>

      <IssuerCard />

      <div className="lg:col-start-1">
        <ActivityFeed
          address={address}
          initial={data.activity}
          serverNow={serverNow}
        />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div
      aria-hidden
      className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] motion-safe:animate-pulse"
    >
      <div className="space-y-3 lg:col-span-2">
        <div className="h-4 w-24 rounded bg-secondary" />
        <div className="h-9 w-2/3 rounded bg-secondary" />
      </div>
      <div className="dapp-console-panel h-64" />
      <div className="dapp-console-panel h-64 lg:row-span-2" />
      <div className="dapp-console-panel h-48" />
    </div>
  );
}
