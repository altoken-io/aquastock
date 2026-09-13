'use client';

import { cn } from '../utils/classNames';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import React, { ReactNode, useId, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

export const selectDisabledClasses =
  'data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:select-none';

export const selectInvalidClasses =
  'data-invalid:ring-red-400/20 dark:data-invalid:ring-red-400/40 data-invalid:border-red-400';

/** Small, fast open/close transition shared by the popup across every Select instance. */
export const selectTransitionClasses = cn(
  'origin-[var(--transform-origin)] transition-[transform,opacity] duration-100 ease-out',
  'data-starting-style:scale-95 data-starting-style:opacity-0',
  'data-ending-style:scale-95 data-ending-style:opacity-0',
);

const triggerDefaultClassName = cn(
  'relative flex w-full cursor-pointer items-center justify-between gap-2 overflow-hidden transition ease-in-out',
  'border border-neutral-300/75 dark:border-neutral-700/75 rounded-md appearance-none',
  'focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:ring-offset-transparent',
  'focus-visible:ring-blue-400/75 dark:focus-visible:ring-blue-600/75',
  'data-popup-open:ring data-popup-open:ring-blue-400/75 dark:data-popup-open:ring-blue-600/75',
  'data-placeholder:text-neutral-400/75 dark:data-placeholder:text-neutral-600/75',
  'touch-manipulation',
  'data-readonly:bg-neutral-50 dark:data-readonly:bg-neutral-900 data-readonly:cursor-default',
  selectDisabledClasses,
  selectInvalidClasses,
);

const selectTriggerVariants = cva(triggerDefaultClassName, {
  variants: {
    variant: {
      none: '',
      solid: 'bg-transparent',
      solidDark: 'bg-neutral-900 text-neutral-100',
      solidLight: 'bg-neutral-50 !dark:bg-neutral-900',
    },
    padding: {
      none: '',
      sm: 'px-2 py-1',
      md: 'px-4 py-2 h-[42px]',
      lg: 'px-6 py-3',
      xl: 'px-8 py-4',
      smlong: 'px-6 py-1',
      mdlong: 'px-8 py-2',
      lglong: 'px-10 py-3',
      xllong: 'px-12 py-4',
    },
    fontSize: {
      none: '',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    shadow: {
      none: '',
      xs: 'shadow-xs',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      cl: 'shadow-none',
      inner: 'shadow-inner',
      current: 'shadow-current',
      inherit: 'shadow-inherit',
      transparent: 'shadow-transparent',
    },
  },
  defaultVariants: {
    variant: 'solidLight',
    padding: 'md',
    fontSize: 'md',
    shadow: 'xs',
  },
});

const popupDefaultClassName = cn(
  'z-50 max-h-[min(24rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto overscroll-contain',
  'rounded-md border border-neutral-300/75 bg-white p-1 shadow-lg outline-none',
  'dark:border-neutral-700/75 dark:bg-neutral-900',
  selectTransitionClasses,
);

const itemDefaultClassName = cn(
  'relative flex w-full cursor-default scroll-my-1 items-center gap-2 rounded-sm px-2.5 py-2 pl-7 text-sm outline-none select-none',
  'data-highlighted:bg-neutral-100 data-highlighted:text-neutral-900',
  'dark:data-highlighted:bg-neutral-800 dark:data-highlighted:text-neutral-100',
  'data-disabled:pointer-events-none data-disabled:opacity-50',
);

/* ------------------------------------------------------------------ */
/* Composable primitives — mirror Base UI's Select anatomy 1:1 so     */
/* consumers can build fully custom selects (groups, separators, etc) */
/* while sharing the same styling and open-transition as the default  */
/* export below.                                                      */
/* ------------------------------------------------------------------ */

export const SelectRoot = BaseSelect.Root;

export const SelectLabel = forwardRef<HTMLDivElement, BaseSelect.Label.Props>(
  ({ className, ...props }, ref) => (
    <BaseSelect.Label
      ref={ref}
      className={cn(
        'text-start text-base font-medium max-sm:text-sm',
        className,
      )}
      {...props}
    />
  ),
);
SelectLabel.displayName = 'SelectLabel';

export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  BaseSelect.Trigger.Props & VariantProps<typeof selectTriggerVariants>
>(({ className, variant, padding, fontSize, shadow, ...props }, ref) => (
  <BaseSelect.Trigger
    ref={ref}
    className={cn(
      selectTriggerVariants({ variant, padding, fontSize, shadow }),
      className,
    )}
    {...props}
  />
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = BaseSelect.Value;

export const SelectIcon = forwardRef<HTMLSpanElement, BaseSelect.Icon.Props>(
  ({ className, children, ...props }, ref) => (
    <BaseSelect.Icon
      ref={ref}
      className={cn('pointer-events-none shrink-0', className)}
      {...props}
    >
      {children ?? <ChevronDown className="size-3.5 opacity-60" />}
    </BaseSelect.Icon>
  ),
);
SelectIcon.displayName = 'SelectIcon';

export const SelectPortal = BaseSelect.Portal;

export const SelectPositioner = forwardRef<
  HTMLDivElement,
  BaseSelect.Positioner.Props
>(
  (
    { className, sideOffset = 4, alignItemWithTrigger = false, ...props },
    ref,
  ) => (
    <BaseSelect.Positioner
      ref={ref}
      sideOffset={sideOffset}
      alignItemWithTrigger={alignItemWithTrigger}
      className={cn('z-50 outline-none', className)}
      {...props}
    />
  ),
);
SelectPositioner.displayName = 'SelectPositioner';

export const SelectPopup = forwardRef<HTMLDivElement, BaseSelect.Popup.Props>(
  ({ className, ...props }, ref) => (
    <BaseSelect.Popup
      ref={ref}
      className={cn(popupDefaultClassName, className)}
      {...props}
    />
  ),
);
SelectPopup.displayName = 'SelectPopup';

export const SelectList = BaseSelect.List;

export const SelectItem = forwardRef<HTMLElement, BaseSelect.Item.Props>(
  ({ className, ...props }, ref) => (
    <BaseSelect.Item
      ref={ref}
      className={cn(itemDefaultClassName, className)}
      {...props}
    />
  ),
);
SelectItem.displayName = 'SelectItem';

export const SelectItemText = BaseSelect.ItemText;

export const SelectItemIndicator = forwardRef<
  HTMLSpanElement,
  BaseSelect.ItemIndicator.Props
>(({ className, children, ...props }, ref) => (
  <BaseSelect.ItemIndicator
    ref={ref}
    className={cn('absolute left-2 flex items-center', className)}
    {...props}
  >
    {children ?? <Check className="size-3.5" />}
  </BaseSelect.ItemIndicator>
));
SelectItemIndicator.displayName = 'SelectItemIndicator';

export const SelectGroup = BaseSelect.Group;

export const SelectGroupLabel = forwardRef<
  HTMLDivElement,
  BaseSelect.GroupLabel.Props
>(({ className, ...props }, ref) => (
  <BaseSelect.GroupLabel
    ref={ref}
    className={cn(
      'px-2.5 pt-2 pb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400',
      className,
    )}
    {...props}
  />
));
SelectGroupLabel.displayName = 'SelectGroupLabel';

export const SelectSeparator: typeof BaseSelect.Separator =
  BaseSelect.Separator;

/* ------------------------------------------------------------------ */
/* High-level `Select` — drop-in replacement for the old native       */
/* `<select>` wrapper: same label/description/error/icon ergonomics,  */
/* built on top of the composable primitives above.                   */
/* ------------------------------------------------------------------ */

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type SelectProps = Omit<
  BaseSelect.Root.Props<string>,
  'children' | 'items'
> &
  VariantProps<typeof selectTriggerVariants> & {
    options: Array<string | SelectOption>;
    icon?: ReactNode;
    label?: string;
    placeholder?: ReactNode;
    description?: string;
    iconClassName?: string;
    labelClassName?: string;
    parentClassName?: string;
    wrapperClassName?: string;
    popupClassName?: string;
    className?: string;
    error?: string | string[];
  };

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      variant,
      icon,
      padding,
      fontSize,
      shadow,
      options,
      placeholder = 'Select an option',
      description,
      iconClassName,
      labelClassName,
      parentClassName,
      wrapperClassName,
      popupClassName,
      className,
      id,
      name,
      error,
      disabled,
      ...rootProps
    },
    ref,
  ) => {
    const uid = useId();
    const selectId = id ?? (name ? `${name}-${uid}` : `select-${uid}`);

    const hasError = Boolean(error);
    const descriptionId = description ? `${selectId}-desc` : undefined;
    const errorId = hasError ? `${selectId}-err` : undefined;
    const describedBy =
      [descriptionId, hasError ? errorId : undefined]
        .filter(Boolean)
        .join(' ') || undefined;

    const normalizedOptions: SelectOption[] = options.map((option) =>
      typeof option === 'string' ? { value: option, label: option } : option,
    );

    return (
      <SelectRoot
        id={selectId}
        name={name}
        disabled={disabled}
        items={normalizedOptions}
        {...rootProps}
      >
        <div className={cn('relative flex flex-col gap-2', parentClassName)}>
          {label && (
            <SelectLabel className={labelClassName}>{label}</SelectLabel>
          )}
          <div
            className={cn(
              'relative flex w-full items-center',
              wrapperClassName,
            )}
          >
            <SelectTrigger
              ref={ref}
              variant={variant}
              padding={padding}
              fontSize={fontSize}
              shadow={shadow}
              aria-invalid={hasError || undefined}
              aria-describedby={describedBy}
              className={cn(icon && 'pl-8', className)}
            >
              {icon && (
                <span
                  className={cn(
                    'pointer-events-none absolute left-2',
                    iconClassName,
                    variant === 'solidDark' && 'text-neutral-100',
                  )}
                  aria-hidden="true"
                >
                  {icon}
                </span>
              )}
              <SelectValue
                placeholder={placeholder}
                className="min-w-0 flex-1 truncate text-left"
              />
              <SelectIcon />
            </SelectTrigger>
          </div>

          <SelectPortal>
            <SelectPositioner>
              <SelectPopup className={popupClassName}>
                <SelectList>
                  {normalizedOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      <SelectItemIndicator />
                      <SelectItemText>{option.label}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>

          {description && (
            <p
              id={descriptionId}
              className="text-start text-sm max-sm:text-xs opacity-60"
            >
              {description}
            </p>
          )}

          {typeof error === 'string' && (
            <p
              id={errorId}
              role="alert"
              className="text-start text-sm max-sm:text-xs text-red-500"
            >
              {error}
            </p>
          )}
          {Array.isArray(error) &&
            error.map((err, i) => (
              <p
                key={`${i}-${err}`}
                role="alert"
                className="text-start text-sm max-sm:text-xs text-red-500"
              >
                {err}
              </p>
            ))}
        </div>
      </SelectRoot>
    );
  },
);

Select.displayName = 'Select';

export default Select;
