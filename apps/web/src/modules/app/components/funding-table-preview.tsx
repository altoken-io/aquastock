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
 * marketing site. Demo data only, matching the illustrative dataset
 * `apps/dapp` itself now uses (`apps/dapp/src/lib/demo/projects.ts`) — this
 * stays explicitly labeled as an example rather than a screenshot of the
 * product, since neither app is reading from a live database yet.
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
        'rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Example project
          </p>
          <h3 className="mt-1 text-xl">Water treatment upgrade</h3>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
          {t('status.ACTIVE')}
        </span>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('goal')}</span>
          <span className="tabular-nums">
            {FUNDING_SPLIT.public + FUNDING_SPLIT.private}%
          </span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
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
            <span className="tabular-nums text-muted-foreground">
              {FUNDING_SPLIT.public}%
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span
              className="size-2 rounded-full bg-private"
              aria-hidden="true"
            />
            {t('communityFunding')}
            <span className="tabular-nums text-muted-foreground">
              {FUNDING_SPLIT.private}%
            </span>
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-3 border-t border-border pt-4">
        {MILESTONES.map((milestone) => {
          const { icon: Icon, className: statusClassName } =
            STATUS_STYLES[milestone.status];
          return (
            <li
              key={milestone.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-foreground/90">
                {MILESTONE_LABELS[milestone.id]}
              </span>
              <span
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium',
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
