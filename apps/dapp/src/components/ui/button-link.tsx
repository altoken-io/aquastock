import React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/utils/classNames';
import { Link } from '@/lib/i18n/navigation';

export const buttonVariants = cva(
  'max-sm:text-sm relative inline-flex items-center justify-center gap-2 whitespace-nowrap transition ease-in-out text-nowrap cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:shadow-sm aria-disabled:hover:shadow-none aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-800/40',
  {
    variants: {
      variant: {
        none: '',
        gradient:
          'bg-gradient-to-r from-primary to-accent text-white hover:brightness-[1.03] active:brightness-95 shadow-sm rounded-md',
        solid:
          'bg-primary text-white hover:bg-accent active:brightness-95 shadow-sm rounded-md',
        solidLight:
          'bg-card text-card-foreground border border-border/70 hover:bg-secondary/80 active:bg-secondary rounded-md',
        solidDark:
          'bg-foreground text-background hover:opacity-95 active:opacity-90 rounded-md',
        transparent:
          'bg-transparent border border-border/70 text-foreground shadow-sm rounded-md hover:bg-secondary/70 active:bg-secondary',
        outline:
          'bg-transparent border border-border/70 text-foreground shadow-none! rounded-md hover:bg-secondary/70 active:bg-secondary',
        link: 'bg-transparent !shadow-none hover:shadow-sm shadow-primary/20 rounded-md hover:bg-secondary/70 active:bg-secondary',
        linkText:
          'p-0! m-0! shadow-none! text-neutral-950/75 hover:text-primary active:text-accent dark:text-neutral-50/75 dark:hover:text-primary dark:active:text-accent',
        danger:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 rounded-md shadow-sm',
        warning:
          'bg-yellow-600 text-white hover:bg-yellow-800 active:bg-yellow-400 rounded-md shadow-sm ',
        success:
          'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 rounded-md shadow-sm',
        info: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-md shadow-sm border border-border/70',
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

export type ButtonLinkProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>;

const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
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
      href = '/',
      target,
      rel,
      ...props
    },
    ref,
  ) => {
    const providedAriaLabel = props['aria-label'] as string | undefined;
    const computedAriaLabel =
      providedAriaLabel ??
      (typeof children === 'string' || typeof children === 'number'
        ? undefined
        : title);

    const computedRel =
      target === '_blank' ? (rel ?? 'noopener noreferrer') : rel;

    return (
      <Link
        ref={ref}
        href={href}
        target={target}
        rel={computedRel}
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
        {...props}
      >
        {children}
      </Link>
    );
  },
);

ButtonLink.displayName = 'ButtonLink';

export default ButtonLink;
