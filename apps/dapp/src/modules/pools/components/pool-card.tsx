'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { PoolDto } from '@aquastock/types';

import { Link } from '@/lib/i18n/navigation';
import { shortPoolId } from '@/lib/pools/naming';

import { useNow } from '../hooks/use-now';
import {
  formatDuration,
  isDemoTimescale,
  shortAddress,
  toIntlLocale,
} from '../lib/format';
import { poolPhase, reservedFraction, secondsLeft } from '../lib/pool-status';
import { useFormatters, useToken } from '../token-context';
import { MatchRing } from './match-ring';
import { DemoTimescaleBadge, PhaseBadge } from './pool-badges';

/** A pool's display name: the sponsor's, or a short numbered fallback. */
export function usePoolName(
  pool: Pick<PoolDto, 'metadata' | 'poolId'>,
): string {
  const t = useTranslations('pools.detail');
  return pool.metadata?.name ?? t('unnamed', { id: shortPoolId(pool.poolId) });
}

export function PoolCard({
  pool,
  serverNow,
  headingLevel: Heading = 'h2',
}: {
  pool: PoolDto;
  serverNow: number;
  /** Follow the page's outline: h2 under the page title, h3 inside a section that has its own h2. */
  headingLevel?: 'h2' | 'h3';
}) {
  const t = useTranslations('pools.card');
  const locale = toIntlLocale(useLocale());
  const f = useFormatters();
  const { symbol } = useToken();
  const now = useNow(serverNow, 15_000);
  const name = usePoolName(pool);

  const phase = poolPhase(pool, now);
  const reserved = reservedFraction(pool);
  const funded = BigInt(pool.budgetTotal) > 0n;
  const percent = f.fraction(reserved);
  const left = secondsLeft(pool, now);

  return (
    <Link
      href={`/pools/${pool.address}`}
      className="group dapp-console-panel flex flex-col gap-4 p-5 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center gap-2">
        <PhaseBadge phase={phase} />
        {isDemoTimescale(pool.vestingSeconds) ? <DemoTimescaleBadge /> : null}
      </div>

      <div className="min-w-0">
        <Heading className="truncate text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
          {name}
        </Heading>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('sponsor')}{' '}
          <span className="tabular-nums">{shortAddress(pool.sponsor)}</span>
        </p>
      </div>

      <div className="flex items-center gap-4">
        <MatchRing
          size={92}
          strokeWidth={10}
          segments={[{ token: 'sponsor', value: reserved }]}
          capacity={funded ? 1 : undefined}
          label={t('ringLabel', { percent })}
        >
          <span className="font-display text-base font-semibold tabular-nums text-foreground">
            {funded ? percent : '—'}
          </span>
        </MatchRing>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t('matchLeft')}
          </p>
          <p className="font-display text-xl font-semibold tabular-nums text-foreground">
            {t('matchLeftValue', { amount: f.tokens(pool.unreserved), symbol })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('match', { percent: f.percent(pool.matchBps) })}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-t border-border/60 pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">{t('cap')}</dt>
          <dd className="mt-0.5 font-medium text-foreground tabular-nums">
            {f.tokens(pool.perSaverCap)} {symbol}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('vests')}</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatDuration(pool.vestingSeconds, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('closes')}</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {left > 0
              ? t('closesIn', { duration: formatDuration(left, locale) })
              : t('closedOn', { date: f.date(pool.endsAt) })}
          </dd>
        </div>
      </dl>
    </Link>
  );
}

export function PoolCardSkeleton() {
  return (
    <div
      aria-hidden
      className="dapp-console-panel flex flex-col gap-4 p-5 motion-safe:animate-pulse"
    >
      <div className="h-6 w-24 rounded-full bg-secondary" />
      <div className="space-y-2">
        <div className="h-5 w-2/3 rounded bg-secondary" />
        <div className="h-3 w-1/3 rounded bg-secondary" />
      </div>
      <div className="flex items-center gap-4">
        <div className="size-[92px] rounded-full bg-secondary" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/2 rounded bg-secondary" />
          <div className="h-6 w-3/4 rounded bg-secondary" />
        </div>
      </div>
      <div className="h-10 rounded bg-secondary/70" />
    </div>
  );
}
