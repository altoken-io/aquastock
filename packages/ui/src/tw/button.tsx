import { cn } from '../utils/classNames';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

export const buttonVariants = cva(
  'max-sm:text-sm relative inline-flex items-center justify-center gap-2 whitespace-nowrap transition ease-in-out text-nowrap cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-sm disabled:hover:shadow-none aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-800/40',
  {
    variants: {
      variant: {
        none: '',
        gradient:
          'bg-gradient-to-r text-white from-emerald-700 to-teal-700 hover:bg-gradient-to-r hover:from-emerald-800 hover:to-teal-800 active:bg-gradient-to-r active:from-emerald-900 active:to-teal-900 shadow-sm rounded-md',
        solid:
          'bg-orange-200 hover:bg-orange-300 active:bg-orange-400 text-neutral-900 shadow-sm rounded-md',
        solidLight:
          'text-neutral-900 dark:text-neutral-100 bg-neutral-50 hover:bg-neutral-200 active:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-900 dark:active:bg-neutral-950 rounded-md',
        solidDark:
          'text-neutral-100 dark:text-neutral-900 bg-neutral-800/95 hover:bg-neutral-900 active:bg-neutral-950 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:active:bg-neutral-300 rounded-md',
        transparent:
          'bg-transparent text-neutral-900 dark:text-white border border-neutral-300/75 dark:border-neutral-700/75 shadow-sm rounded-md hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-900',
        outline:
          'bg-transparent text-neutral-900 dark:text-white border border-neutral-300/75 dark:border-neutral-700/75 shadow-none! rounded-md hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-900',
        link: 'bg-transparent !shadow-none hover:shadow-sm shadow-emerald-300/50 dark:shadow-emerald-700/50 hover:rounded-md hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-900',
        danger:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 rounded-md shadow-sm',
        warning:
          'bg-yellow-600 text-white hover:bg-yellow-800 active:bg-yellow-400 rounded-md shadow-sm ',
        success:
          'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 rounded-md shadow-sm',
        info: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-md shadow-sm border border-neutral-300/75 dark:border-neutral-700/75',
        disabled:
          'bg-gray-400 text-gray-200 cursor-not-allowed select-none pointer-events-none shadow-none hover:shadow-none active:shadow-none active:bg-current hover:bg-current hover:text-current active:text-current rounded-md',
      },
      width: {
        none: '',
        sm: 'w-20',
        smlong: 'w-32',
        md: 'w-40',
        mdlong: 'w-52',
        lg: 'w-60',
        xl: 'w-80',
        fit: 'w-fit',
        full: 'w-full',
        auto: 'w-auto',
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
        sqsm: 'p-2',
        sqmd: 'p-4',
        sqlg: 'p-6',
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
      rounded: {
        none: '',
        cl: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
      },
      animation: {
        none: '',
        shadow: 'hover:shadow-lg active:shadow-md transition-shadow',
        grow: 'hover:scale-[1.02] active:scale-[0.98] transition-transform',
        slideY:
          'hover:-translate-y-1 active:translate-y-0.5 transition-transform',
        background:
          'hover:bg-opacity-90 active:bg-opacity-100 transition-colors',
        text: 'hover:text-opacity-90 active:text-opacity-100 transition-colors',
        border:
          'hover:border-opacity-90 active:border-opacity-100 transition-colors',
        glow: 'hover:ring-2 hover:ring-opacity-50 active:ring-opacity-75 transition-all',
      },
    },
    defaultVariants: {
      fontSize: 'md',
      padding: 'md',
      width: 'fit',
      shadow: 'sm',
      rounded: 'none',
      animation: 'none',
      variant: 'solidLight',
    },
  },
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      title,
      padding,
      width,
      shadow,
      variant,
      children,
      rounded,
      fontSize,
      animation,
      className,
      ...props
    },
    ref,
  ) => {
    const providedAriaLabel = props['aria-label'] as string | undefined;
    const hasText =
      typeof children === 'string' || typeof children === 'number';
    const computedAriaLabel =
      providedAriaLabel ?? (!hasText ? title : undefined);

    const { type = 'button', ...rest } = props;

    return (
      <button
        ref={ref}
        type={type}
        {...(computedAriaLabel ? { 'aria-label': computedAriaLabel } : {})}
        className={cn(
          buttonVariants({
            variant,
            padding,
            shadow,
            rounded,
            animation,
            width,
            fontSize,
          }),
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
