import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

type EnhancedInputProps = React.ComponentProps<'input'> & {
  description?: string;
  error?: string | string[];
  icon?: React.ReactNode;
  iconClassName?: string;
  label?: string;
  labelClassName?: string;
  parentClassName?: string;
  wrapperClassName?: string;
};

function EnhancedInput({
  className,
  description,
  error,
  icon,
  iconClassName,
  id,
  label,
  labelClassName,
  name,
  parentClassName,
  wrapperClassName,
  ...props
}: EnhancedInputProps) {
  const uid = React.useId();
  const inputId = id ?? (name ? `${name}-${uid}` : `input-${uid}`);
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('relative flex flex-col gap-2', parentClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className={cn(
            'text-start text-base font-medium max-sm:text-sm',
            labelClassName,
          )}
        >
          {label}
        </label>
      ) : null}
      <div
        className={cn('relative flex w-full items-center', wrapperClassName)}
      >
        <Input
          id={inputId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(icon && 'pl-8', className)}
          {...props}
        />
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute left-2.5 text-muted-foreground',
              iconClassName,
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      {description ? (
        <p
          id={descriptionId}
          className="text-start text-sm opacity-60 max-sm:text-xs"
        >
          {description}
        </p>
      ) : null}
      {typeof error === 'string' ? (
        <p
          id={errorId}
          role="alert"
          className="text-start text-sm text-destructive max-sm:text-xs"
        >
          {error}
        </p>
      ) : null}
      {Array.isArray(error)
        ? error.map((message) => (
            <p
              key={message}
              role="alert"
              className="text-start text-sm text-destructive max-sm:text-xs"
            >
              {message}
            </p>
          ))
        : null}
    </div>
  );
}

export { Input };
export default EnhancedInput;
