'use client';

import { cn } from '@/utils/classNames';
import { type ComponentProps, type ReactNode, useId, forwardRef } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';

export const textareaDisabledClasses =
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:select-none';

export const textareaInvalidClasses =
  'aria-invalid:ring-red-400/20 dark:aria-invalid:ring-red-400/40 aria-invalid:border-red-400';

const defaultClassName = cn(
  'relative transition ease-in-out w-full border border-neutral-300/75 dark:border-neutral-700/75 rounded-md',
  'focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:ring-offset-transparent',
  'focus-visible:ring-blue-400/75 dark:focus-visible:ring-blue-600/75',
  'placeholder:text-neutral-400/75 dark:placeholder:text-neutral-600/75',
  'touch-manipulation selection:bg-blue-200/75 dark:selection:bg-blue-900/75',
  'read-only:bg-neutral-50 dark:read-only:bg-neutral-800 read-only:cursor-default',
  'aria-busy:opacity-75 aria-busy:cursor-wait',
  textareaDisabledClasses,
  textareaInvalidClasses,
);

const textareaVariants = cva(defaultClassName, {
  variants: {
    variant: {
      none: '',
      solid: 'bg-transparent',
      solidDark: 'bg-neutral-900 text-neutral-100',
      solidLight: 'bg-neutral-100 dark:bg-neutral-900',
    },
    padding: {
      none: '',
      sm: 'px-2 py-1',
      md: 'px-4 py-2',
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

export type TextareaProps = ComponentProps<'textarea'> &
  VariantProps<typeof textareaVariants> & {
    icon?: ReactNode;
    label?: string;
    description?: string;
    iconClassName?: string;
    labelClassName?: string;
    parentClassName?: string;
    wrapperClassName?: string;
    error?: string | string[];
  };

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      variant,
      icon,
      padding,
      fontSize,
      shadow,
      description,
      placeholder = 'Enter text here',
      iconClassName,
      labelClassName,
      parentClassName,
      wrapperClassName,
      className,
      error,
      id,
      name,
      rows = 5,
      ...rest
    },
    ref,
  ) => {
    const uid = useId();
    const textareaId = id ?? (name ? `${name}-${uid}` : `textarea-${uid}`);

    const hasError = Boolean(error);
    const descriptionId = description ? `${textareaId}-desc` : undefined;
    const errorId = hasError ? `${textareaId}-err` : undefined;

    // Accessible name: prefer visible <label>. Only set aria-label if no label provided.
    const ariaLabel = !label
      ? (rest['aria-label'] ?? (name || undefined))
      : undefined;
    const describedBy =
      [descriptionId, hasError ? errorId : undefined]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
      <div className={cn('relative flex flex-col gap-2', parentClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'text-start text-base max-sm:text-sm font-medium',
              labelClassName,
            )}
          >
            {label}
          </label>
        )}

        <div
          className={cn('relative flex items-center w-full', wrapperClassName)}
        >
          <textarea
            ref={ref}
            id={textareaId}
            name={name}
            rows={rows}
            placeholder={placeholder}
            aria-label={ariaLabel}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            aria-errormessage={hasError ? errorId : undefined}
            className={cn(
              textareaVariants({ variant, padding, shadow, fontSize }),
              icon && 'pl-8',
              className,
            )}
            {...rest}
          />
          {icon && (
            <span
              className={cn(
                'absolute left-[10px] top-[14px] pointer-events-none',
                iconClassName,
                variant === 'solidDark' && 'text-neutral-100',
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
        </div>

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
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
