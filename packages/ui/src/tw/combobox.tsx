'use client';

import { cn } from '../utils/classNames';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { Check, ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';

export const comboboxDisabledClasses =
  'data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:select-none';

export const comboboxInvalidClasses =
  'data-invalid:ring-red-400/20 dark:data-invalid:ring-red-400/40 data-invalid:border-red-400';

/** Small, fast open/close transition shared by the popup across every Combobox instance. */
export const comboboxTransitionClasses = cn(
  'origin-[var(--transform-origin)] transition-[transform,opacity] duration-100 ease-out',
  'data-starting-style:scale-95 data-starting-style:opacity-0',
  'data-ending-style:scale-95 data-ending-style:opacity-0',
);

const triggerDefaultClassName = cn(
  'relative flex w-full cursor-pointer items-center justify-between gap-2 overflow-hidden transition ease-in-out',
  'border border-neutral-300/75 dark:border-neutral-700/75 rounded-md appearance-none',
  'px-4 py-2',
  'focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:ring-offset-transparent',
  'focus-visible:ring-blue-400/75 dark:focus-visible:ring-blue-600/75',
  'data-popup-open:ring data-popup-open:ring-blue-400/75 dark:data-popup-open:ring-blue-600/75',
  'touch-manipulation',
  comboboxDisabledClasses,
  comboboxInvalidClasses,
);

const inputDefaultClassName = cn(
  'w-full border-0 border-b border-neutral-300/75 bg-transparent px-2.5 py-2 text-sm outline-none',
  'dark:border-neutral-700/75',
  'placeholder:text-neutral-400/75 dark:placeholder:text-neutral-600/75',
);

const popupDefaultClassName = cn(
  'z-50 flex max-h-[min(24rem,var(--available-height))] min-w-[var(--anchor-width)] flex-col overflow-hidden',
  'rounded-md border border-neutral-300/75 bg-white shadow-lg outline-none',
  'dark:border-neutral-700/75 dark:bg-neutral-900',
  comboboxTransitionClasses,
);

const listDefaultClassName = 'flex-1 overflow-y-auto overscroll-contain p-1';

const emptyDefaultClassName =
  'px-2.5 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400';

const itemDefaultClassName = cn(
  'relative flex w-full cursor-default scroll-my-1 items-center gap-2 rounded-sm px-2.5 py-2 pl-7 text-sm outline-none select-none',
  'data-highlighted:bg-neutral-100 data-highlighted:text-neutral-900',
  'dark:data-highlighted:bg-neutral-800 dark:data-highlighted:text-neutral-100',
  'data-disabled:pointer-events-none data-disabled:opacity-50',
);

/* ------------------------------------------------------------------ */
/* Composable primitives — mirror Base UI's Combobox anatomy 1:1 so   */
/* consumers can build fully custom searchable pickers (groups, a     */
/* trigger-only "input inside popup" layout, etc) while sharing the   */
/* same styling and open-transition as `Select` above. Unlike Select, */
/* Combobox ships `Input` and filters `items` automatically as the    */
/* user types — no manual search-state wiring required.               */
/* ------------------------------------------------------------------ */

export const ComboboxRoot = BaseCombobox.Root;

export const ComboboxLabel = forwardRef<
  HTMLDivElement,
  BaseCombobox.Label.Props
>(({ className, ...props }, ref) => (
  <BaseCombobox.Label
    ref={ref}
    className={cn('text-start text-base font-medium max-sm:text-sm', className)}
    {...props}
  />
));
ComboboxLabel.displayName = 'ComboboxLabel';

export const ComboboxTrigger = forwardRef<
  HTMLButtonElement,
  BaseCombobox.Trigger.Props
>(({ className, ...props }, ref) => (
  <BaseCombobox.Trigger
    ref={ref}
    className={cn(triggerDefaultClassName, className)}
    {...props}
  />
));
ComboboxTrigger.displayName = 'ComboboxTrigger';

export const ComboboxValue = BaseCombobox.Value;

export const ComboboxIcon = forwardRef<
  HTMLSpanElement,
  BaseCombobox.Icon.Props
>(({ className, children, ...props }, ref) => (
  <BaseCombobox.Icon
    ref={ref}
    className={cn('pointer-events-none shrink-0', className)}
    {...props}
  >
    {children ?? <ChevronDown className="size-3.5 opacity-60" />}
  </BaseCombobox.Icon>
));
ComboboxIcon.displayName = 'ComboboxIcon';

export const ComboboxPortal = BaseCombobox.Portal;

export const ComboboxPositioner = forwardRef<
  HTMLDivElement,
  BaseCombobox.Positioner.Props
>(({ className, sideOffset = 4, ...props }, ref) => (
  <BaseCombobox.Positioner
    ref={ref}
    sideOffset={sideOffset}
    className={cn('z-50 outline-none', className)}
    {...props}
  />
));
ComboboxPositioner.displayName = 'ComboboxPositioner';

export const ComboboxPopup = forwardRef<
  HTMLDivElement,
  BaseCombobox.Popup.Props
>(({ className, ...props }, ref) => (
  <BaseCombobox.Popup
    ref={ref}
    className={cn(popupDefaultClassName, className)}
    {...props}
  />
));
ComboboxPopup.displayName = 'ComboboxPopup';

export const ComboboxInput = forwardRef<
  HTMLInputElement,
  BaseCombobox.Input.Props
>(({ className, ...props }, ref) => (
  <BaseCombobox.Input
    ref={ref}
    className={cn(inputDefaultClassName, className)}
    {...props}
  />
));
ComboboxInput.displayName = 'ComboboxInput';

export const ComboboxEmpty = forwardRef<
  HTMLDivElement,
  BaseCombobox.Empty.Props
>(({ className, ...props }, ref) => (
  <BaseCombobox.Empty
    ref={ref}
    className={cn(emptyDefaultClassName, className)}
    {...props}
  />
));
ComboboxEmpty.displayName = 'ComboboxEmpty';

export const ComboboxList = forwardRef<HTMLDivElement, BaseCombobox.List.Props>(
  ({ className, ...props }, ref) => (
    <BaseCombobox.List
      ref={ref}
      className={cn(listDefaultClassName, className)}
      {...props}
    />
  ),
);
ComboboxList.displayName = 'ComboboxList';

export const ComboboxItem = forwardRef<HTMLDivElement, BaseCombobox.Item.Props>(
  ({ className, ...props }, ref) => (
    <BaseCombobox.Item
      ref={ref}
      className={cn(itemDefaultClassName, className)}
      {...props}
    />
  ),
);
ComboboxItem.displayName = 'ComboboxItem';

export const ComboboxItemIndicator = forwardRef<
  HTMLSpanElement,
  BaseCombobox.ItemIndicator.Props
>(({ className, children, ...props }, ref) => (
  <BaseCombobox.ItemIndicator
    ref={ref}
    className={cn('absolute left-2 flex items-center', className)}
    {...props}
  >
    {children ?? <Check className="size-3.5" />}
  </BaseCombobox.ItemIndicator>
));
ComboboxItemIndicator.displayName = 'ComboboxItemIndicator';

export const ComboboxGroup = BaseCombobox.Group;

export const ComboboxGroupLabel = forwardRef<
  HTMLDivElement,
  BaseCombobox.GroupLabel.Props
>(({ className, ...props }, ref) => (
  <BaseCombobox.GroupLabel
    ref={ref}
    className={cn(
      'px-2.5 pt-2 pb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400',
      className,
    )}
    {...props}
  />
));
ComboboxGroupLabel.displayName = 'ComboboxGroupLabel';
