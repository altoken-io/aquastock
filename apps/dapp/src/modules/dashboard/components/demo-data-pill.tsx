import { FlaskConical } from 'lucide-react';

import { cn } from '@/utils/classNames';

/** Marks a dashboard surface as demo-only — no Anchor program/route handlers exist yet (docs/ROADMAP.md). */
export function DemoDataPill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
