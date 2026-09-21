import { getTranslations } from 'next-intl/server';

import { cn } from '@/utils/classNames';

// Illustrative: 100 deposited, 100 matched, 12 months of vesting, leaving at month 3.
const SAMPLE = { deposit: 100, match: 100, months: 12, leaveAt: 3 } as const;
const VESTED = (SAMPLE.match * SAMPLE.leaveAt) / SAMPLE.months;
const GIVEN_UP = SAMPLE.match - VESTED;

function Row({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: number;
  tone?: 'saver' | 'sponsor';
  note?: string;
}) {
  return (
    <li className="flex items-baseline gap-2 py-1.5 text-sm">
      <span className="shrink-0 text-foreground/90">{label}</span>
      <span
        aria-hidden="true"
        className="h-px flex-1 border-b border-dotted border-border"
      />
      <span
        className={cn(
          'font-mono-ui shrink-0 tabular-nums',
          tone === 'saver' && 'text-private',
          tone === 'sponsor' && 'text-public',
        )}
      >
        {value} SPYx
      </span>
      {note ? (
        <span className="font-mono-ui hidden shrink-0 text-[10px] tracking-[0.06em] text-muted-foreground uppercase sm:inline">
          {note}
        </span>
      ) : null}
    </li>
  );
}

/**
 * The marketing site's plainest answer to "what happens if I leave early": a
 * ledger, in the same receipt style as the hero panel. Numbers are illustrative
 * and the panel says so; the arithmetic is the program's own (linear vesting,
 * rounded down, the whole deposit always returned).
 */
export async function LeavingEarlyPreview({
  className,
}: {
  className?: string;
}) {
  const t = await getTranslations('confluence.preview');

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-border bg-card p-6 sm:p-7',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-dashed border-border pb-5">
        <div>
          <p className="font-mono-ui text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            {t('kicker')}
          </p>
          <h3 className="mt-1 text-xl">{t('title')}</h3>
        </div>
        <span className="font-mono-ui shrink-0 rounded-sm border border-border px-2 py-1 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {t('badge')}
        </span>
      </div>

      <ul className="flex flex-col gap-0.5">
        <Row label={t('rows.deposit')} value={SAMPLE.deposit} tone="saver" />
        <Row label={t('rows.match')} value={SAMPLE.match} tone="sponsor" />
        <Row label={t('rows.vested')} value={VESTED} />
      </ul>

      <ul className="mt-4 flex flex-col gap-0.5 border-t border-border pt-4">
        <Row label={t('rows.back')} value={SAMPLE.deposit} tone="saver" />
        <Row label={t('rows.keep')} value={VESTED} />
        <Row
          label={t('rows.giveUp')}
          value={GIVEN_UP}
          tone="sponsor"
          note={t('giveUpNote')}
        />
      </ul>

      <p className="mt-5 border-t border-dashed border-border pt-4 text-sm text-muted-foreground">
        {t('lead')}
      </p>
    </div>
  );
}
