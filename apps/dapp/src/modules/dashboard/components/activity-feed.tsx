import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleCheck,
  Landmark,
  PackageOpen,
  Sparkles,
  Undo2,
  type LucideIcon,
} from 'lucide-react';

import type { PoolActivityKind } from '@aquastock/types';

import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';

export type ActivityRow = {
  id: string;
  text: string;
  date: string;
  href: string;
  kind: PoolActivityKind;
};

const ICONS: Record<PoolActivityKind, LucideIcon> = {
  POOL_CREATED: Sparkles,
  MATCH_FUNDED: Landmark,
  DEPOSITED: ArrowDownToLine,
  CLAIMED: CircleCheck,
  WITHDRAWN: ArrowUpFromLine,
  UNMATCHED_RECLAIMED: Undo2,
  POSITION_CLOSED: PackageOpen,
};

/** Recent events across pools, each already re-read from the chain before it was recorded. */
export function ActivityFeed({
  entries,
  emptyLabel,
  className,
}: {
  entries: readonly ActivityRow[];
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
    <ul className={cn('flex flex-col gap-4', className)}>
      {entries.map((entry) => {
        const Icon = ICONS[entry.kind];
        return (
          <li key={entry.id} className="flex items-start gap-3">
            <span className="dapp-icon-tile shrink-0 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <Link
                href={entry.href}
                className="text-sm text-foreground hover:text-primary"
              >
                {entry.text}
              </Link>
              <p className="text-xs text-muted-foreground">{entry.date}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
