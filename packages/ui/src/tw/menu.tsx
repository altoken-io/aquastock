'use client';

import { cn } from '../utils/classNames';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/** Small, fast open/close transition shared by the popup across every Menu instance. */
export const menuTransitionClasses = cn(
  'origin-[var(--transform-origin)] transition-[transform,opacity] duration-100 ease-out',
  'data-starting-style:scale-95 data-starting-style:opacity-0',
  'data-ending-style:scale-95 data-ending-style:opacity-0',
);

const triggerVariants = cva(
  'relative inline-flex cursor-pointer items-center justify-center gap-2 transition ease-in-out',
  {
    variants: {
      variant: {
        none: '',
        ghost:
          'rounded-md text-neutral-700 hover:bg-neutral-100 data-popup-open:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:data-popup-open:bg-neutral-800',
      },
    },
    defaultVariants: {
      variant: 'none',
    },
  },
);

const popupDefaultClassName = cn(
  'z-50 min-w-[10rem] overflow-y-auto overscroll-contain',
  'rounded-md border border-neutral-300/75 bg-white p-1 shadow-lg outline-none',
  'dark:border-neutral-700/75 dark:bg-neutral-900',
  menuTransitionClasses,
);

const itemDefaultClassName = cn(
  'relative flex w-full cursor-default scroll-my-1 items-center gap-2 rounded-sm px-2.5 py-2 text-sm outline-none select-none',
  'data-highlighted:bg-neutral-100 data-highlighted:text-neutral-900',
  'dark:data-highlighted:bg-neutral-800 dark:data-highlighted:text-neutral-100',
  'data-disabled:pointer-events-none data-disabled:opacity-50',
);

/* ------------------------------------------------------------------ */
/* Composable primitives — mirror Base UI's Menu anatomy 1:1. Used for */
/* action dropdowns (kebab/overflow menus, nav flyouts) as opposed to  */
/* `Select`, which is for persisted-value pickers.                    */
/* ------------------------------------------------------------------ */

export const MenuRoot = BaseMenu.Root;

export const MenuTrigger = forwardRef<
  HTMLButtonElement,
  BaseMenu.Trigger.Props & VariantProps<typeof triggerVariants>
>(({ className, variant, ...props }, ref) => (
  <BaseMenu.Trigger
    ref={ref}
    className={cn(triggerVariants({ variant }), className)}
    {...props}
  />
));
MenuTrigger.displayName = 'MenuTrigger';

export const MenuPortal = BaseMenu.Portal;

export const MenuPositioner = forwardRef<
  HTMLDivElement,
  BaseMenu.Positioner.Props
>(({ className, sideOffset = 6, ...props }, ref) => (
  <BaseMenu.Positioner
    ref={ref}
    sideOffset={sideOffset}
    className={cn('z-50 outline-none', className)}
    {...props}
  />
));
MenuPositioner.displayName = 'MenuPositioner';

export const MenuPopup = forwardRef<HTMLDivElement, BaseMenu.Popup.Props>(
  ({ className, ...props }, ref) => (
    <BaseMenu.Popup
      ref={ref}
      className={cn(popupDefaultClassName, className)}
      {...props}
    />
  ),
);
MenuPopup.displayName = 'MenuPopup';

export const MenuItem = forwardRef<HTMLElement, BaseMenu.Item.Props>(
  ({ className, ...props }, ref) => (
    <BaseMenu.Item
      ref={ref}
      className={cn(itemDefaultClassName, className)}
      {...props}
    />
  ),
);
MenuItem.displayName = 'MenuItem';

/** A navigable menu entry — renders `<a>`. Defaults `closeOnClick` to `true`
 * (Base UI defaults it to `false` for links) since closing after navigation
 * is what every consumer of this component wants. */
export const MenuLinkItem = forwardRef<Element, BaseMenu.LinkItem.Props>(
  ({ className, closeOnClick = true, ...props }, ref) => (
    <BaseMenu.LinkItem
      ref={ref}
      closeOnClick={closeOnClick}
      className={cn(itemDefaultClassName, className)}
      {...props}
    />
  ),
);
MenuLinkItem.displayName = 'MenuLinkItem';

export const MenuGroup = BaseMenu.Group;

export const MenuGroupLabel = forwardRef<
  HTMLDivElement,
  BaseMenu.GroupLabel.Props
>(({ className, ...props }, ref) => (
  <BaseMenu.GroupLabel
    ref={ref}
    className={cn(
      'px-2.5 pt-2 pb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400',
      className,
    )}
    {...props}
  />
));
MenuGroupLabel.displayName = 'MenuGroupLabel';

export const MenuSeparator: typeof BaseMenu.Separator = BaseMenu.Separator;
