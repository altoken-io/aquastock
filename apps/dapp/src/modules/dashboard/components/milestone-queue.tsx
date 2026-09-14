import { CheckCircle2 } from 'lucide-react';

import type { MilestoneStatus } from '@aquastock/types';
import { Tooltip } from '@aquastock/ui/tw/tooltip';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';
import type { MilestoneQueueEntry } from '@/lib/demo/projects';
import { MilestoneStatusBadge } from '@/modules/product/components/milestone-status-badge';

/**
 * Milestones still awaiting verification — the admin console's core queue.
 * "Mark verified" stays disabled with an explanatory tooltip: there is no
 * Anchor program yet (docs/ROADMAP.md), and PRODUCT.md's "no false
 * certainty" rule means this can't fake a state the chain hasn't confirmed.
 */
export function MilestoneQueue({
  entries,
  statusLabels,
  verifyLabel,
  verifyDisabledReason,
  emptyLabel,
  className,
}: {
  entries: readonly MilestoneQueueEntry[];
  statusLabels: Record<MilestoneStatus, string>;
  verifyLabel: string;
  verifyDisabledReason: string;
  emptyLabel: string;
  className?: string;
}) {
  if (entries.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className={cn('flex flex-col divide-y divide-border/70', className)}>
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex flex-wrap items-center justify-between gap-3 py-3"
        >
          <div className="min-w-0">
            <Link
              href={`/projects/${entry.projectSlug}`}
              className="block truncate text-sm font-medium text-foreground hover:text-primary"
            >
              {entry.title}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {entry.projectName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MilestoneStatusBadge
              status={entry.status}
              label={statusLabels[entry.status]}
            />
            <Tooltip content={verifyDisabledReason}>
              <span
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-border/70 bg-secondary/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground/70"
                aria-disabled="true"
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {verifyLabel}
              </span>
            </Tooltip>
          </div>
        </li>
      ))}
    </ul>
  );
}
