'use client';

import type { ReactNode } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@aquastock/ui/tw/dialog';

/**
 * The app's shared dialog (Base UI: focus trap, Escape, outside click, scroll lock) for
 * decisions that cannot be undone. `onClose` fires however it is dismissed.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:p-6">
        <DialogTitle className="font-display text-xl">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
