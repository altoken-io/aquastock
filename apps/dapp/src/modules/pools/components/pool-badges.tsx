import {
  CircleCheck,
  FlaskConical,
  Flag,
  Hourglass,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/utils/classNames';

import type { PoolPhase } from '../lib/pool-status';

const PHASES: Record<PoolPhase, { icon: LucideIcon; tone: string }> = {
  open: { icon: CircleCheck, tone: 'border-ok/30 bg-ok/10 text-ok-text' },
  'ending-soon': {
    icon: Hourglass,
    tone: 'border-warning/40 bg-warning/15 text-foreground',
  },
  'budget-full': {
    icon: Layers,
    tone: 'border-border bg-secondary text-foreground',
  },
  ended: {
    icon: Flag,
    tone: 'border-border bg-secondary text-muted-foreground',
  },
};

/** Where a pool stands, as an icon AND a word, never colour alone. */
export function PhaseBadge({
  phase,
  className,
}: {
  phase: PoolPhase;
  className?: string;
}) {
  const t = useTranslations('pools.phase');
  const { icon: Icon, tone } = PHASES[phase];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        tone,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {t(phase)}
    </span>
  );
}

/** Flags a vesting period that is a demo setting, so nobody mistakes it for a real horizon. */
export function DemoTimescaleBadge({ className }: { className?: string }) {
  const t = useTranslations('pools.demo');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary',
        className,
      )}
    >
      <FlaskConical aria-hidden className="size-3.5" />
      {t('badge')}
    </span>
  );
}
