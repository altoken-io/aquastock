import { CircleAlert, Info, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/utils/classNames';

const TONES = {
  info: {
    icon: Info,
    box: 'border-border bg-secondary/50',
    iconClass: 'text-muted-foreground',
  },
  warning: {
    icon: CircleAlert,
    box: 'border-warning/40 bg-warning/10',
    iconClass: 'text-warning',
  },
} satisfies Record<
  string,
  { icon: LucideIcon; box: string; iconClass: string }
>;

/** A short message with an icon, so meaning never rests on colour alone. */
export function Notice({
  tone = 'info',
  live = 'status',
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  /** `alert` interrupts a screen reader; use it only for things the person must fix now. */
  live?: 'status' | 'alert';
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, box, iconClass } = TONES[tone];
  return (
    <div
      role={live}
      className={cn(
        'dapp-enter flex gap-2.5 rounded-lg border p-3 text-sm text-foreground',
        box,
        className,
      )}
    >
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', iconClass)} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
