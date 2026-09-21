'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleCheck,
  ExternalLink,
  Landmark,
  PackageOpen,
  Sparkles,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import type {
  PoolActivityDto,
  PoolActivityKind,
  PoolActivityPageDto,
} from '@aquastock/types';

import { useActivity } from '../hooks/queries';
import { useNow } from '../hooks/use-now';
import { formatRelativeTime, shortAddress, toIntlLocale } from '../lib/format';
import { useFormatters, useToken } from '../token-context';
import { ActionButton } from './actions';

const ICONS: Record<PoolActivityKind, LucideIcon> = {
  POOL_CREATED: Sparkles,
  MATCH_FUNDED: Landmark,
  DEPOSITED: ArrowDownToLine,
  CLAIMED: CircleCheck,
  WITHDRAWN: ArrowUpFromLine,
  UNMATCHED_RECLAIMED: Undo2,
  POSITION_CLOSED: PackageOpen,
};

export function ActivityFeed({
  address,
  initial,
  serverNow,
}: {
  address: string;
  initial: PoolActivityPageDto;
  serverNow: number;
}) {
  const t = useTranslations('pools.activity');
  const locale = toIntlLocale(useLocale());
  const f = useFormatters();
  const { symbol } = useToken();
  const { publicKey } = useWallet();
  const me = publicKey?.toBase58() ?? null;
  const now = useNow(serverNow, 15_000);
  const query = useActivity(address, initial);

  const items = query.data.pages.flatMap((page) => page.items);

  const sentence = (item: PoolActivityDto): string =>
    t(`kinds.${item.kind}`, {
      who: item.wallet === me ? t('you') : shortAddress(item.wallet),
      amount: f.tokens(item.amount ?? '0'),
      match: f.tokens(item.matchAmount ?? '0'),
      symbol,
    });

  return (
    <section
      className="dapp-console-panel p-5"
      aria-labelledby="activity-title"
    >
      <h2 id="activity-title" className="text-base font-semibold">
        {t('title')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {t('empty.title')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('empty.description')}
          </p>
        </div>
      ) : (
        <ol className="mt-4 flex flex-col">
          {items.map((item) => {
            const Icon = ICONS[item.kind];
            return (
              <li
                key={item.id}
                className="flex gap-3 border-b border-border/60 py-3 last:border-b-0"
              >
                <span className="dapp-icon-tile mt-0.5 size-8! rounded-lg! shrink-0">
                  <Icon aria-hidden className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{sentence(item)}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <time dateTime={item.occurredAt}>
                      {formatRelativeTime(
                        new Date(item.occurredAt),
                        new Date(now * 1_000),
                        locale,
                      )}
                    </time>
                    <a
                      href={f.explorer('tx', item.txSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                    >
                      {t('viewTx')}
                      <ExternalLink aria-hidden className="size-3" />
                    </a>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {query.hasNextPage ? (
        <div className="mt-3">
          <ActionButton
            variant="secondary"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? t('loading') : t('loadMore')}
          </ActionButton>
        </div>
      ) : null}
      {query.isError ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {t('error')}
        </p>
      ) : null}
    </section>
  );
}
