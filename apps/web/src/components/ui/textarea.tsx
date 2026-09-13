import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

type EnhancedTextareaProps = React.ComponentProps<'textarea'> & {
  description?: string;
  error?: string | string[];
  icon?: React.ReactNode;
  iconClassName?: string;
  label?: string;
  labelClassName?: string;
  parentClassName?: string;
  wrapperClassName?: string;
};

function EnhancedTextarea({
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
}: EnhancedTextareaProps) {
  const uid = React.useId();
  const textareaId = id ?? (name ? `${name}-${uid}` : `textarea-${uid}`);
  const descriptionId = description ? `${textareaId}-description` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('relative flex flex-col gap-2', parentClassName)}>
      {label ? (
        <label
          htmlFor={textareaId}
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
        <Textarea
          id={textareaId}
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
              'pointer-events-none absolute left-2.5 top-3.5 text-muted-foreground',
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

export { Textarea };
export default EnhancedTextarea;
