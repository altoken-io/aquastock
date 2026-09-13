'use client';

import React, {
  ReactNode,
  useState,
  ComponentProps,
  useEffect,
  useId,
  forwardRef,
} from 'react';
import { cn } from '@/utils/classNames';
import { cva, type VariantProps } from 'class-variance-authority';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Tooltip } from '@aquastock/ui/tw/tooltip';

export const inputDisabledClasses =
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:select-none';

export const inputInvalidClasses =
  'aria-invalid:ring-red-400/25 dark:aria-invalid:ring-red-400/50 aria-invalid:!border-red-400';

const defaultClassName = cn(
  'relative transition ease-in-out w-full rounded-md border border-border/70 bg-background text-foreground',
  'focus-visible:outline-none focus-visible:ring focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:ring-offset-transparent',
  'focus-visible:ring-primary/35 dark:focus-visible:ring-primary/45',
  'placeholder:text-muted-foreground/70',
  'touch-manipulation selection:bg-primary/20',
  'read-only:bg-secondary/60 read-only:cursor-default',
  'file:bg-secondary/80 hover:file:bg-secondary file:cursor-pointer file:pl-8 file:pr-4 file:py-2 file:mr-2 file:transition',
  'aria-busy:opacity-75 aria-busy:cursor-wait',
  'hover:shadow-sm hover:shadow-primary/10',
  'active:shadow-md active:shadow-primary/15',
  inputDisabledClasses,
  inputInvalidClasses,
);

const inputVariants = cva(defaultClassName, {
  variants: {
    variant: {
      none: '',
      solid: 'bg-transparent',
      solidDark: 'bg-foreground text-background',
      solidLight: 'bg-card',
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

export type InputProps = ComponentProps<'input'> &
  VariantProps<typeof inputVariants> & {
    icon?: ReactNode;
    label?: string;
    error?: string | string[];
    description?: string;
    iconClassName?: string;
    labelClassName?: string;
    parentClassName?: string;
    wrapperClassName?: string;
  };

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      variant,
      icon,
      padding,
      fontSize,
      shadow,
      error,
      description,
      placeholder = 'Enter text here',
      iconClassName,
      labelClassName,
      parentClassName,
      wrapperClassName,
      className,
      type = 'text',
      id,
      name,
      onChange,
      autoComplete,
      ...rest
    },
    ref,
  ) => {
    const [viewPassword, setViewPassword] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const uid = useId();

    const inputId = id ?? (name ? `${name}-${uid}` : `input-${type}-${uid}`);
    // Prefer visible <label>; only set aria-label when no label provided
    const ariaLabel = !label
      ? (rest['aria-label'] ?? name ?? undefined)
      : undefined;

    const hasError = Boolean(error);
    const descriptionId = description ? `${inputId}-desc` : undefined;
    const errorId = hasError ? `${inputId}-err` : undefined;

    // Safer preview: use Object URLs and revoke to avoid memory leaks
    useEffect(() => {
      return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      };
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (previewUrl) URL.revokeObjectURL(previewUrl); // revoke previous
      if (file) {
        setFileName(file.name);
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        } else {
          setPreviewUrl(null);
        }
      } else {
        setFileName(null);
        setPreviewUrl(null);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === 'file') handleFileChange(e);
      onChange?.(e);
    };

    return (
      <div className={cn('relative flex flex-col gap-2', parentClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-start text-base font-medium max-sm:text-sm',
              labelClassName,
            )}
          >
            {label}
          </label>
        )}
        <div
          className={cn('relative flex w-full items-center', wrapperClassName)}
        >
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type === 'password' && viewPassword ? 'text' : type}
            placeholder={placeholder}
            aria-label={ariaLabel}
            aria-invalid={hasError || undefined}
            aria-describedby={
              [descriptionId, errorId].filter(Boolean).join(' ') || undefined
            }
            autoComplete={
              autoComplete ??
              (type === 'password' ? 'current-password' : undefined)
            }
            onChange={handleChange}
            className={cn(
              inputVariants({ variant, padding, shadow, fontSize }),
              icon && 'px-8',
              type === 'password' && 'pr-12',
              type === 'file' && 'p-0',
              className,
            )}
            {...rest}
          />

          {icon && (
            <span
              className={cn(
                'pointer-events-none absolute left-[10px]',
                iconClassName,
                variant === 'solidDark' && 'text-neutral-100',
              )}
            >
              {icon}
            </span>
          )}

          {type === 'password' && (
            <Tooltip content={viewPassword ? 'Hide password' : 'Show password'}>
              <button
                type="button"
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/30"
                onClick={() => setViewPassword(!viewPassword)}
                aria-label={viewPassword ? 'Hide password' : 'Show password'}
                aria-pressed={viewPassword}
              >
                {viewPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </Tooltip>
          )}
        </div>

        {type === 'file' && (
          <div className="flex items-center gap-2">
            {previewUrl && (
              <img
                src={previewUrl}
                alt={
                  fileName ? `Preview of ${fileName}` : 'Selected file preview'
                }
                className="h-full w-full max-w-40 rounded-md"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="flex flex-col gap-px">
              <h1 className="font-medium">Preview</h1>
              {fileName ? (
                <h1 className="text-muted">{fileName}</h1>
              ) : (
                <h1 className="text-muted">No file selected</h1>
              )}
            </div>
          </div>
        )}

        {description && (
          <p
            id={descriptionId}
            className="text-start text-sm opacity-60 max-sm:text-xs"
          >
            {description}
          </p>
        )}

        {typeof error === 'string' && (
          <p
            id={errorId}
            role="alert"
            className="text-start text-sm text-red-500 max-sm:text-xs"
          >
            {error}
          </p>
        )}
        {error &&
          typeof error === 'object' &&
          Object.values(error).map((err) => (
            <p
              key={err}
              role="alert"
              className="text-start text-sm text-red-500 max-sm:text-xs"
            >
              {err}
            </p>
          ))}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
