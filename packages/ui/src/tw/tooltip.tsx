'use client';

import { cn } from '../utils/classNames';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import React, { forwardRef } from 'react';

/** Small, fast open/close transition shared by the popup across every Tooltip instance. */
const tooltipTransitionClasses = cn(
  'origin-[var(--transform-origin)] transition-[transform,opacity] duration-100 ease-out',
  'data-starting-style:scale-95 data-starting-style:opacity-0',
  'data-ending-style:scale-95 data-ending-style:opacity-0',
);

const popupDefaultClassName = cn(
  'z-50 max-w-64 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-50 shadow-lg outline-none',
  'dark:bg-neutral-100 dark:text-neutral-900',
  tooltipTransitionClasses,
);

/* ------------------------------------------------------------------ */
/* Composable primitives — mirror Base UI's Tooltip anatomy 1:1. Wrap a */
/* whole app (or subtree) in one `TooltipProvider` so adjacent tooltips */
/* share the open/close delay grouping, per Base UI's own guidance.     */
/* ------------------------------------------------------------------ */

export const TooltipProvider = BaseTooltip.Provider;

export const TooltipRoot = BaseTooltip.Root;

export const TooltipTrigger = forwardRef<
  HTMLButtonElement,
  BaseTooltip.Trigger.Props
>((props, ref) => <BaseTooltip.Trigger ref={ref} {...props} />);
TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipPortal = BaseTooltip.Portal;

export const TooltipPositioner = forwardRef<
  HTMLDivElement,
  BaseTooltip.Positioner.Props
>(({ className, sideOffset = 8, ...props }, ref) => (
  <BaseTooltip.Positioner
    ref={ref}
    sideOffset={sideOffset}
    className={cn('z-50 outline-none', className)}
    {...props}
  />
));
TooltipPositioner.displayName = 'TooltipPositioner';

export const TooltipPopup = forwardRef<HTMLDivElement, BaseTooltip.Popup.Props>(
  ({ className, ...props }, ref) => (
    <BaseTooltip.Popup
      ref={ref}
      className={cn(popupDefaultClassName, className)}
      {...props}
    />
  ),
);
TooltipPopup.displayName = 'TooltipPopup';

/* ------------------------------------------------------------------ */
/* Convenience component — the common case: wrap an existing (usually  */
/* icon-only) trigger element with a styled tooltip. Uses Base UI's    */
/* `render` prop so the trigger's own element (e.g. an icon <button>)  */
/* receives the trigger behavior directly instead of being wrapped in  */
/* a second, nested <button>.                                          */
/* ------------------------------------------------------------------ */

export interface TooltipProps extends Pick<
  BaseTooltip.Root.Props,
  'defaultOpen' | 'open' | 'onOpenChange' | 'disabled'
> {
  /** The tooltip's content. */
  content: React.ReactNode;
  /** The single element the tooltip is attached to. */
  children: React.ReactElement;
  side?: BaseTooltip.Positioner.Props['side'];
  sideOffset?: number;
  /** Delay in ms before the tooltip opens on hover. @default 400 */
  delay?: number;
  popupClassName?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  sideOffset,
  delay,
  disabled,
  defaultOpen,
  open,
  onOpenChange,
  popupClassName,
}: TooltipProps) {
  return (
    <TooltipRoot
      disabled={disabled}
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
    >
      <TooltipTrigger render={children} delay={delay} />
      <TooltipPortal>
        <TooltipPositioner side={side} sideOffset={sideOffset}>
          <TooltipPopup className={popupClassName}>{content}</TooltipPopup>
        </TooltipPositioner>
      </TooltipPortal>
    </TooltipRoot>
  );
}
