'use client';

import { cn } from '../utils/classNames';
import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { forwardRef } from 'react';

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-24 text-2xl',
} as const;

export interface AvatarProps {
  /** Omit/leave falsy to show the fallback (initials) directly. */
  src?: string | null;
  alt: string;
  /** Shown while the image loads, is missing, or fails to load. */
  fallback: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Profile photo with an automatic initials fallback — wraps Base UI's
 *  Avatar (loading-state aware: falls back on missing src or a load error,
 *  not just an empty src) the same way `select.tsx`/`menu.tsx` wrap theirs. */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt, fallback, size = 'md', className }, ref) => (
    <BaseAvatar.Root
      ref={ref}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-border bg-secondary font-semibold text-foreground',
        SIZES[size],
        className,
      )}
    >
      {src ? (
        <BaseAvatar.Image
          src={src}
          alt={alt}
          className="size-full object-cover"
        />
      ) : null}
      <BaseAvatar.Fallback className="flex size-full items-center justify-center uppercase">
        {fallback}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  ),
);
Avatar.displayName = 'Avatar';
