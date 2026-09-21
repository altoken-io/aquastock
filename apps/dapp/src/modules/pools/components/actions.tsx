import type { ComponentProps } from 'react';

import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';

const base =
  'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap outline-none transition-[color,background-color,border-color,opacity,scale] duration-150 ease-out motion-safe:active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50';

export const actionClasses = {
  primary: cn(
    base,
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary-pressed',
  ),
  secondary: cn(
    base,
    'border border-border/70 bg-card text-foreground shadow-sm hover:bg-secondary/80',
  ),
  danger: cn(
    base,
    'border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15',
  ),
  ghost: cn(
    base,
    'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
  ),
} as const;

export type ActionVariant = keyof typeof actionClasses;

export function ActionButton({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: ActionVariant }) {
  return (
    <button
      type="button"
      className={cn(actionClasses[variant], className)}
      {...props}
    />
  );
}

export function ActionLink({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ActionVariant }) {
  return <Link className={cn(actionClasses[variant], className)} {...props} />;
}
