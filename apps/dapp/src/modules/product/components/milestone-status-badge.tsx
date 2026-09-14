import {
  CheckCircle2,
  CircleDashed,
  Clock,
  type LucideIcon,
} from 'lucide-react';

import type { MilestoneStatus } from '@aquastock/types';
import { cn } from '@/utils/classNames';

const STYLES: Record<MilestoneStatus, { icon: LucideIcon; className: string }> =
  {
    VERIFIED: { icon: CheckCircle2, className: 'text-ok' },
    IN_PROGRESS: { icon: Clock, className: 'text-warning' },
    PENDING: { icon: CircleDashed, className: 'text-muted-foreground' },
  };

/**
 * Pairs milestone status with both an icon and a label — never color alone
 * (docs/VISUAL.md). Takes an already-translated `label` (from the
 * `milestones` namespace) so this stays presentational-only.
 */
export function MilestoneStatusBadge({
  status,
  label,
  className,
}: {
  status: MilestoneStatus;
  label: string;
  className?: string;
}) {
  const { icon: Icon, className: styleClassName } = STYLES[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        styleClassName,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
