'use client';

import { useTranslations } from 'next-intl';

import type { Draft } from '../lib/create-pool';
import { poolReach } from '../lib/create-pool';
import { formatDuration } from '../lib/format';
import { useFormatters, useToken } from '../token-context';
import { MatchRing } from './match-ring';
import { useUsd } from '../hooks/use-price';
import { LedgerRow } from './stream-legend';

/**
 * The pool as the sponsor is building it: the Confluence at full use (the sponsor's match
 * closing around the savers' own deposits), and what the budget buys in plain numbers. It
 * fills in as the form does, so abstract fields turn into something a person can picture.
 */
export function PoolPreview({
  name,
  draft,
  locale,
}: {
  name: string;
  draft: Draft;
  locale: string;
}) {
  const t = useTranslations('create.preview');
  const tRows = useTranslations('create.review.rows');
  const f = useFormatters();
  const usd = useUsd();
  const { symbol } = useToken();

  const reach =
    draft.budgetUnits !== null &&
    draft.capUnits !== null &&
    draft.matchBps !== null
      ? poolReach(draft.budgetUnits, draft.capUnits, draft.matchBps)
      : null;
  const savers = reach?.fullyMatchedSavers ?? null;
  const percent = draft.matchBps !== null ? f.percent(draft.matchBps) : null;

  return (
    <section
      aria-label={t('title')}
      className="dapp-console-panel flex flex-col items-center gap-5 p-5 sm:p-6"
    >
      <div className="w-full">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t('title')}
        </p>
        <p className="font-display mt-1 text-xl font-semibold text-balance">
          {name.trim() === '' ? t('unnamed') : name.trim()}
        </p>
      </div>

      <MatchRing
        size={184}
        strokeWidth={14}
        segments={
          draft.matchBps === null
            ? []
            : [
                { token: 'sponsor', value: draft.matchBps },
                { token: 'saver', value: 10_000 },
              ]
        }
        label={percent ? t('ringLabel', { percent }) : t('pending')}
      >
        <span className="font-display text-4xl leading-none font-semibold tabular-nums">
          {savers === null ? '—' : savers.toString()}
        </span>
        <span className="mt-1.5 text-xs text-muted-foreground">
          {savers === null
            ? t('pending')
            : t('savers', { count: Number(savers) })}
        </span>
      </MatchRing>

      <dl className="w-full">
        <LedgerRow
          stream="sponsor"
          label={tRows('budget')}
          value={
            draft.budgetRaw === null
              ? '—'
              : `${f.tokens(draft.budgetRaw)} ${symbol}`
          }
          emphasis
          usd={draft.budgetRaw === null ? null : usd(draft.budgetRaw)}
        />
        <LedgerRow
          stream="sponsor"
          label={tRows('match')}
          value={percent ?? '—'}
        />
        <LedgerRow
          stream="saver"
          label={tRows('cap')}
          value={
            draft.capRaw === null ? '—' : `${f.tokens(draft.capRaw)} ${symbol}`
          }
          usd={draft.capRaw === null ? null : usd(draft.capRaw)}
        />
        <LedgerRow
          label={tRows('vesting')}
          value={
            draft.vestingSeconds === null
              ? '—'
              : formatDuration(draft.vestingSeconds, locale)
          }
        />
        <LedgerRow
          label={tRows('window')}
          value={
            draft.windowSeconds === null
              ? '—'
              : formatDuration(draft.windowSeconds, locale)
          }
        />
      </dl>
    </section>
  );
}
