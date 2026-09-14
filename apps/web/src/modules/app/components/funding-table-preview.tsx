import { getTranslations } from 'next-intl/server';
import { CheckCircle2, CircleDashed, Clock } from 'lucide-react';

import { cn } from '@/utils/classNames';

const FUNDING_SPLIT = { public: 60, private: 35 } as const;

const MILESTONES = [
  { id: 'assessment', status: 'VERIFIED' } as const,
  { id: 'procurement', status: 'IN_PROGRESS' } as const,
  { id: 'commissioning', status: 'PENDING' } as const,
];

const MILESTONE_LABELS: Record<(typeof MILESTONES)[number]['id'], string> = {
  assessment: 'Site assessment',
  procurement: 'Equipment procurement',
  commissioning: 'Plant commissioning',
};

const STATUS_STYLES = {
  VERIFIED: { icon: CheckCircle2, className: 'text-ok' },
  IN_PROGRESS: { icon: Clock, className: 'text-warning' },
  PENDING: { icon: CircleDashed, className: 'text-muted-foreground' },
} as const;

/**
 * A concrete answer to "what does one project actually look like" for the
 * marketing site, styled as a ledger/receipt rather than a generic progress
 * card — line items with dotted leaders, mono numerals, a stamped status.
 * Demo data only, matching the illustrative dataset `apps/dapp` itself now
 * uses (`apps/dapp/src/lib/demo/projects.ts`) — stays explicitly labeled as
 * an example rather than a screenshot of the product, since neither app is
 * reading from a live database yet.
 */
export async function FundingTablePreview({
  className,
}: {
  className?: string;
}) {
  const t = await getTranslations('project');
  const m = await getTranslations('milestones');

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
            Ledger — example project
          </p>
          <h3 className="mt-1 text-xl">Water treatment upgrade</h3>
        </div>
        <span className="font-mono-ui shrink-0 rounded-sm border border-ok/30 bg-ok/10 px-2 py-1 text-[10px] tracking-[0.14em] text-ok uppercase">
          {t('status.ACTIVE')}
        </span>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono-ui tracking-[0.1em] uppercase">
            {t('goal')}
          </span>
          <span className="font-mono-ui text-foreground tabular-nums">
            {FUNDING_SPLIT.public + FUNDING_SPLIT.private}%
          </span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-xs border border-border">
          <div
            className="h-full bg-public"
            style={{ width: `${FUNDING_SPLIT.public}%` }}
            aria-hidden="true"
          />
          <div
            className="h-full bg-private"
            style={{ width: `${FUNDING_SPLIT.private}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="flex items-center gap-2">
            <span
              className="size-2 rounded-full bg-public"
              aria-hidden="true"
            />
            {t('governmentContribution')}
            <span className="font-mono-ui text-muted-foreground tabular-nums">
              {FUNDING_SPLIT.public}%
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span
              className="size-2 rounded-full bg-private"
              aria-hidden="true"
            />
            {t('communityFunding')}
            <span className="font-mono-ui text-muted-foreground tabular-nums">
              {FUNDING_SPLIT.private}%
            </span>
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-1 border-t border-border pt-4">
        {MILESTONES.map((milestone) => {
          const { icon: Icon, className: statusClassName } =
            STATUS_STYLES[milestone.status];
          return (
            <li
              key={milestone.id}
              className="flex items-baseline gap-2 py-1.5 text-sm"
            >
              <span className="shrink-0 text-foreground/90">
                {MILESTONE_LABELS[milestone.id]}
              </span>
              <span
                aria-hidden="true"
                className="h-px flex-1 border-b border-dotted border-border"
              />
              <span
                className={cn(
                  'font-mono-ui flex shrink-0 items-center gap-1.5 text-[11px] tracking-[0.06em] uppercase',
                  statusClassName,
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {m(`status.${milestone.status}`)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
