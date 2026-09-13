'use client';

import { Menu as BaseMenu } from '@base-ui/react/menu';

import { cn } from '../utils/classNames';

/**
 * Thin styling wrapper around Base UI's Menu primitive (keyboard navigation,
 * typeahead, and positioning come from Base UI). Higher-level, pre-composed
 * alternative to the raw `Menu*` primitives in `./menu` — use this for a
 * standard "more actions" dropdown.
 */
export const DropdownMenu = BaseMenu.Root;
export const DropdownMenuTrigger = BaseMenu.Trigger;

export function DropdownMenuContent({
  children,
  align = 'end',
}: {
  children: React.ReactNode;
  align?: 'start' | 'end';
}) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        side="bottom"
        align={align}
        sideOffset={6}
        className="z-50"
      >
        <BaseMenu.Popup className="min-w-[200px] origin-[var(--transform-origin)] rounded-lg border border-border/85 bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-[transform,opacity] duration-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  variant = 'default',
  disabled,
  render,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  /** Renders the item as a different element, e.g. a `next/link` <Link>. */
  render?: React.ReactElement;
}) {
  return (
    <BaseMenu.Item
      onClick={onClick}
      disabled={disabled}
      render={render}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-secondary',
        variant === 'danger'
          ? 'text-destructive data-[highlighted]:bg-destructive/10'
          : 'text-foreground',
      )}
    >
      {children}
    </BaseMenu.Item>
  );
}

export function DropdownMenuSeparator() {
  return <BaseMenu.Separator className="my-1 h-px bg-border/70" />;
}
