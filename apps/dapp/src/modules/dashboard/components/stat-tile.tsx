import type { LucideIcon } from 'lucide-react';

import { cn } from '@/utils/classNames';

export function StatTile({
  label,
  value,
  caption,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border/85 bg-card p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="dapp-icon-tile">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <span className="font-display text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </span>
      {caption && (
        <span className="text-xs text-muted-foreground">{caption}</span>
      )}
    </div>
  );
}
