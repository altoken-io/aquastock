import { Landmark, Wallet, type LucideIcon } from 'lucide-react';

import { cn } from '@/utils/classNames';

export type StreamKind = 'sponsor' | 'saver';

const STREAMS: Record<StreamKind, { icon: LucideIcon; tone: string }> = {
  sponsor: {
    icon: Landmark,
    tone: 'border-sponsor/30 bg-sponsor/10 text-sponsor',
  },
  saver: { icon: Wallet, tone: 'border-saver/30 bg-saver/10 text-saver' },
};

/**
 * Names a stream with an icon AND a label, never colour alone (DESIGN.md's split rule), so
 * the difference between the sponsor's match and your savings survives colour-blindness and
 * a greyscale screenshot.
 */
export function StreamTag({
  stream,
  children,
  className,
}: {
  stream: StreamKind;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, tone } = STREAMS[stream];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        tone,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {children}
    </span>
  );
}

/** One line of a ledger: what it is, and its exact amount. */
export function LedgerRow({
  label,
  value,
  stream,
  emphasis,
}: {
  label: string;
  value: string;
  stream?: StreamKind;
  emphasis?: boolean;
}) {
  const Icon = stream ? STREAMS[stream].icon : null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2.5 last:border-b-0">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon ? (
          <Icon
            aria-hidden
            className={cn(
              'size-4',
              stream === 'sponsor' ? 'text-sponsor' : 'text-saver',
            )}
          />
        ) : null}
        {label}
      </dt>
      <dd
        className={cn(
          'text-right tabular-nums',
          emphasis
            ? 'text-base font-semibold text-foreground'
            : 'text-sm text-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
