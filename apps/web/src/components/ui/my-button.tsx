import { cn } from '@/utils/classNames';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

export const buttonVariants = cva(
  'max-sm:text-sm relative inline-flex items-center justify-center gap-2 whitespace-nowrap transition ease-in-out text-nowrap cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-sm disabled:hover:shadow-none aria-invalid:border-destructive aria-invalid:ring-destructive/20',
  {
    variants: {
      variant: {
        none: '',
        primary:
          'rounded-md bg-primary text-primary-foreground hover:opacity-90 active:opacity-80',
        secondary:
          'rounded-md bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        outline:
          'rounded-md border border-border bg-transparent shadow-xs hover:bg-muted active:bg-secondary',
        transparent:
          'rounded-md border border-border bg-transparent hover:bg-muted active:bg-secondary',
        destructive:
          'rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20',
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
      variant: 'secondary',
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
