import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '../utils/classNames';

/**
 * Status pill. Uses the consuming app's semantic color tokens (`warning`,
 * `destructive`, `ok`, `info`, `secondary`) rather than hard-coded palette
 * colors, so it inherits light/dark theming automatically — see how
 * `tw/dialog.tsx`/`tw/dropdown-menu.tsx` already lean on `border`/`card`/
 * `popover` tokens instead of raw Tailwind colors.
 */
export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full bg-current/10 px-2.5 py-1 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'text-muted-foreground',
        info: 'text-info',
        warning: 'text-warning',
        success: 'text-ok',
        danger: 'text-destructive',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    /** Renders a small leading status dot. */
    dot?: boolean;
    /** Pulses the dot — use for states genuinely awaiting action. */
    pulse?: boolean;
  };

export function Badge({
  variant,
  dot,
  pulse,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full bg-current',
            pulse && 'motion-safe:animate-pulse',
          )}
        />
      )}
      {children}
    </span>
  );
}
