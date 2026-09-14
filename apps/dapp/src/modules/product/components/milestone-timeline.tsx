import type { Milestone, MilestoneStatus } from '@aquastock/types';

import { cn } from '@/utils/classNames';
import { MilestoneStatusBadge } from './milestone-status-badge';

const DOT_STYLES: Record<MilestoneStatus, string> = {
  VERIFIED: 'border-ok bg-ok/15',
  IN_PROGRESS: 'border-warning bg-warning/15',
  PENDING: 'border-border bg-card',
};

const CORE_STYLES: Record<MilestoneStatus, string> = {
  VERIFIED: 'bg-ok',
  IN_PROGRESS: 'bg-warning',
  PENDING: 'bg-muted-foreground/40',
};

/** A project's milestone plan, oldest first, each paired with an icon+label status. */
export function MilestoneTimeline({
  milestones,
  statusLabels,
  formatVerifiedOn,
  className,
}: {
  milestones: readonly Milestone[];
  statusLabels: Record<MilestoneStatus, string>;
  /** Given an ISO date string, returns the full "Verified <date>" caption. */
  formatVerifiedOn: (verifiedAtIso: string) => string;
  className?: string;
}) {
  const ordered = [...milestones].sort((a, b) => a.order - b.order);

  return (
    <ol className={cn('flex flex-col', className)}>
      {ordered.map((milestone, index) => (
        <li key={milestone.id} className="relative flex gap-4 pb-8 last:pb-0">
          {index < ordered.length - 1 && (
            <span
              className="absolute top-6 left-[11px] h-full w-px bg-border"
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              'relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2',
              DOT_STYLES[milestone.status],
            )}
            aria-hidden="true"
          >
            <span
              className={cn(
                'size-2 rounded-full',
                CORE_STYLES[milestone.status],
              )}
            />
          </span>
          <div className="flex flex-1 flex-col gap-1 pt-px">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <h3 className="text-sm font-medium text-foreground">
                {milestone.title}
              </h3>
              <MilestoneStatusBadge
                status={milestone.status}
                label={statusLabels[milestone.status]}
              />
            </div>
            {milestone.description && (
              <p className="text-sm text-muted-foreground">
                {milestone.description}
              </p>
            )}
            {milestone.verifiedAt && (
              <p className="text-xs text-muted-foreground/80">
                {formatVerifiedOn(milestone.verifiedAt)}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
