'use client';

import { CloudOff, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';

import {
  usePools,
  type PoolListData,
  type PoolStatusFilter,
} from '../hooks/queries';
import { ActionButton, ActionLink } from './actions';
import { PoolCard, PoolCardSkeleton } from './pool-card';

const FILTERS: PoolStatusFilter[] = ['open', 'ended', 'all'];

export function PoolListView({
  initial,
  status,
  serverNow,
}: {
  /** Null when the server could not read the chain; the browser then tries for itself. */
  initial: PoolListData | null;
  status: PoolStatusFilter;
  serverNow: number;
}) {
  const t = useTranslations('pools.list');
  const query = usePools(status, initial ?? undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label={t('filterLabel')}
          className="flex items-center gap-1.5"
        >
          {FILTERS.map((filter) => (
            <Link
              key={filter}
              href={{
                pathname: '/pools',
                query: filter === 'all' ? {} : { status: filter },
              }}
              aria-current={filter === status ? 'page' : undefined}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                filter === status
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border/70 bg-card text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
              )}
            >
              {t(`filters.${filter}`)}
            </Link>
          ))}
        </nav>
        {query.data ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t('count', { count: query.data.total })}
          </p>
        ) : null}
      </div>

      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <PoolCardSkeleton key={i} />
          ))}
        </div>
      ) : query.isError && !query.data ? (
        <StateCard
          icon={
            <CloudOff aria-hidden className="size-6 text-muted-foreground" />
          }
          title={t('error.title')}
          description={t('error.description')}
          action={
            <ActionButton
              variant="secondary"
              onClick={() => void query.refetch()}
            >
              {t('error.retry')}
            </ActionButton>
          }
        />
      ) : query.data && query.data.pools.length === 0 ? (
        <StateCard
          title={t('empty.title')}
          description={t('empty.description')}
          action={
            <ActionLink href="/pools/new">
              <Plus aria-hidden className="size-4" />
              {t('empty.cta')}
            </ActionLink>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data?.pools.map((pool) => (
            <li key={pool.address}>
              <PoolCard pool={pool} serverNow={serverNow} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StateCard({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="dapp-console-panel flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon}
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
