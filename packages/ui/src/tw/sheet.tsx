'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';

import { cn } from '../utils/classNames';

/**
 * Edge-anchored variant of `tw/dialog.tsx` — same Base UI Dialog primitive
 * (focus trap, Esc/outside-click dismissal, scroll locking), styled as a
 * slide-in panel instead of a centered modal. Use for navigation drawers and
 * other off-canvas panels; use `Dialog` for centered confirmations/forms.
 *
 * Base UI also ships a dedicated `Drawer` primitive, but it's built for
 * swipeable bottom sheets with snap points — more than a nav panel needs.
 * This stays on `Dialog`, consistent with the rest of `tw/*`.
 */
export const Sheet = BaseDialog.Root;
export const SheetTrigger = BaseDialog.Trigger;
export const SheetClose = BaseDialog.Close;

// No unconditional transform here — the settled/open state must render at
// translate-x-0 (its natural position). Only the starting/ending transition
// phases push the panel off-screen, same convention as dialog.tsx's
// scale/opacity. An unconditional `-translate-x-full` alongside a base
// `translate-x-0` previously fought over the same tailwind-merge slot and
// always won, leaving the panel permanently off-screen even while "open".
const SIDE_STYLES = {
  left: 'inset-y-0 left-0 h-full w-[min(300px,85vw)] border-r data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
  right:
    'inset-y-0 right-0 h-full w-[min(300px,85vw)] border-l data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
} as const;

export function SheetContent({
  side = 'left',
  className,
  children,
}: {
  side?: keyof typeof SIDE_STYLES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[1px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:bg-black/50" />
      <BaseDialog.Popup
        className={cn(
          'fixed z-50 flex flex-col border-border/85 bg-card text-card-foreground shadow-xl outline-none transition-transform duration-200 ease-out',
          SIDE_STYLES[side],
          className,
        )}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return (
    <BaseDialog.Title className="text-base font-semibold">
      {children}
    </BaseDialog.Title>
  );
}
