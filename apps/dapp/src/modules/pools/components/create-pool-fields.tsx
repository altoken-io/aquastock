'use client';

import type { ReactNode } from 'react';

import { cn } from '@/utils/classNames';

import { DURATION_UNITS, type DurationUnit } from '../lib/create-pool';

const controlClasses =
  'w-full rounded-lg border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60';

/** The ids a control uses to point at its hint and its error, so a screen reader reads both. */
export function describedBy(
  id: string,
  { hint, error }: { hint: boolean; error: boolean },
): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(
    (value): value is string => value !== null,
  );
  return ids.length > 0 ? ids.join(' ') : undefined;
}

/** Label, control, hint and error in one place, so every field reads and behaves the same. */
export function Field({
  id,
  label,
  badge,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  /** For example "Optional". */
  badge?: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {badge ? (
          <span className="text-xs text-muted-foreground">{badge}</span>
        ) : null}
      </div>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength,
  invalid,
  describedBy: described,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      autoComplete="off"
      aria-invalid={invalid || undefined}
      aria-describedby={described}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      className={cn(
        controlClasses,
        invalid ? 'border-destructive' : 'border-border',
      )}
    />
  );
}

export function TextArea({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength,
  invalid,
  describedBy: described,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <textarea
      id={id}
      value={value}
      rows={4}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-invalid={invalid || undefined}
      aria-describedby={described}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      className={cn(
        controlClasses,
        'resize-y',
        invalid ? 'border-destructive' : 'border-border',
      )}
    />
  );
}

/** A number with a fixed suffix inside the box, such as "%". */
export function SuffixInput({
  id,
  value,
  onChange,
  onBlur,
  suffix,
  action,
  inputMode = 'decimal',
  invalid,
  describedBy: described,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  suffix: string;
  /** A control inside the box after the suffix, such as "Max". */
  action?: ReactNode;
  inputMode?: 'decimal' | 'numeric';
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-background px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30',
        invalid ? 'border-destructive' : 'border-border',
      )}
    >
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={described}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent py-2.5 text-base tabular-nums outline-none"
      />
      <span className="text-sm font-medium text-muted-foreground">
        {suffix}
      </span>
      {action}
    </div>
  );
}

/** A whole number and a unit (minutes, hours, days). */
export function DurationInput({
  id,
  value,
  unit,
  onChange,
  onBlur,
  unitLabel,
  unitNames,
  invalid,
  describedBy: described,
}: {
  id: string;
  value: string;
  unit: DurationUnit;
  onChange: (next: { value: string; unit: DurationUnit }) => void;
  onBlur?: () => void;
  unitLabel: string;
  unitNames: Record<DurationUnit, string>;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={described}
        onChange={(event) =>
          onChange({
            value: event.target.value.replace(/\D/g, '').slice(0, 6),
            unit,
          })
        }
        onBlur={onBlur}
        className={cn(
          controlClasses,
          'min-w-0 flex-1 tabular-nums',
          invalid ? 'border-destructive' : 'border-border',
        )}
      />
      <select
        aria-label={unitLabel}
        value={unit}
        onChange={(event) => {
          const next = DURATION_UNITS.find((u) => u === event.target.value);
          if (next) onChange({ value, unit: next });
        }}
        onBlur={onBlur}
        className={cn(controlClasses, 'w-auto border-border pr-8')}
      >
        {DURATION_UNITS.map((u) => (
          <option key={u} value={u}>
            {unitNames[u]}
          </option>
        ))}
      </select>
    </div>
  );
}

/** One-tap common values. `pressed` shows which one the field currently equals. */
export function QuickPicks<T>({
  label,
  options,
  isPressed,
  onPick,
}: {
  label: string;
  options: { key: string; label: string; value: T }[];
  isPressed: (value: T) => boolean;
  onPick: (value: T) => void;
}) {
  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const pressed = isPressed(option.value);
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={pressed}
            onClick={() => onPick(option.value)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              pressed
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
