import { CircleDollarSign, ShieldCheck } from 'lucide-react';

import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';

export type ActivityRow = {
  id: string;
  text: string;
  date: string;
  href: string;
  kind: 'position_funded' | 'milestone_verified';
};

/** Demo activity only — no live on-chain feed exists yet (docs/ROADMAP.md). */
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
        const Icon =
          entry.kind === 'milestone_verified' ? ShieldCheck : CircleDollarSign;
        return (
          <li key={entry.id} className="flex items-start gap-3">
            <span
              className={cn(
                'dapp-icon-tile shrink-0',
                entry.kind === 'milestone_verified'
                  ? 'text-ok'
                  : 'text-primary',
              )}
            >
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
