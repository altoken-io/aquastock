'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';

import { cn } from '../utils/classNames';

/**
 * Thin styling wrapper around Base UI's Dialog primitive — handles focus
 * trapping, Esc/outside-click dismissal, and scroll locking for us; this
 * file only owns how it looks.
 */
export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[1px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:bg-black/50" />
      <BaseDialog.Popup
        className={cn(
          'fixed top-1/2 left-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/85 bg-card p-5 text-card-foreground shadow-xl outline-none transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
          className,
        )}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseDialog.Title className={cn('text-base font-semibold', className)}>
      {children}
    </BaseDialog.Title>
  );
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return (
    <BaseDialog.Description className="mt-1.5 text-sm text-muted-foreground">
      {children}
    </BaseDialog.Description>
  );
}
