'use client';

import type { ReactNode } from 'react';

import { cn } from '@/utils/classNames';

import { sanitizeAmountInput } from '../lib/amount-input';

/**
 * A token amount box: big tabular numerals, the symbol inside the field, and an optional
 * "Max". Typing is cleaned as it happens (see `sanitizeAmountInput`) so what is in the box is
 * always something the amount parser can read.
 */
export function AmountField({
  id,
  label,
  value,
  onChange,
  symbol,
  disabled,
  invalid,
  describedBy,
  max,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  symbol: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  max?: {
    label: string;
    text: string;
    onClick: () => void;
    disabled?: boolean;
  };
  /** A line above the field, on the right of the label (for example the balance). */
  hint?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {hint ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {hint}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30',
          invalid ? 'border-destructive' : 'border-border',
          disabled && 'opacity-60',
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="0"
          value={value}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) =>
            onChange(sanitizeAmountInput(event.target.value))
          }
          className="font-display min-w-0 flex-1 bg-transparent py-3 text-2xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/50"
        />
        <span className="text-sm font-medium text-muted-foreground">
          {symbol}
        </span>
        {max ? (
          <button
            type="button"
            onClick={max.onClick}
            disabled={disabled || max.disabled}
            aria-label={max.label}
            className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {max.text}
          </button>
        ) : null}
      </div>
    </div>
  );
}
