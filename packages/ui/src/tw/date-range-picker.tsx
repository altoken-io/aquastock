'use client';

import { Popover as BasePopover } from '@base-ui/react/popover';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '../utils/classNames';

/**
 * Thin styling wrapper around Base UI's Popover primitive, composed with a
 * hand-rolled calendar grid — Base UI has no calendar/date-picker primitive
 * (see base-ui.com/react/components), so the day grid itself is custom here.
 */

export interface DateRangeValue {
  from: string;
  to: string;
}

export interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (range: DateRangeValue) => void;
  fromLabel: string;
  toLabel: string;
  placeholder: string;
  clearLabel: string;
  /** Locale for month/day formatting; defaults to the browser locale. */
  locale?: string;
  className?: string;
}

const WEEKDAY_FORMATTER_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'narrow',
};

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISODate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  return Boolean(a && b && toISODate(a) === toISODate(b));
}

function getMonthMatrix(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = new Array(startWeekday).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(new Date(year, month, day));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function DateRangePicker({
  from,
  to,
  onChange,
  fromLabel,
  toLabel,
  placeholder,
  clearLabel,
  locale,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const fromDate = useMemo(() => parseISODate(from), [from]);
  const toDate = useMemo(() => parseISODate(to), [to]);

  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(fromDate ?? new Date()),
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }),
    [locale],
  );
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(
      locale,
      WEEKDAY_FORMATTER_OPTIONS,
    );
    // 2023-01-01 is a Sunday — used purely as a stable week anchor.
    return Array.from({ length: 7 }, (_, i) =>
      formatter.format(addDays(new Date(2023, 0, 1), i)),
    );
  }, [locale]);

  const weeks = useMemo(
    () => getMonthMatrix(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth],
  );

  const today = useMemo(() => startOfDay(new Date()), []);

  const previewTo = fromDate && !toDate ? hoverDate : null;
  const rangeEnd = toDate ?? previewTo;

  const triggerLabel =
    fromDate && toDate
      ? `${dayFormatter.format(fromDate)} – ${dayFormatter.format(toDate)}`
      : fromDate
        ? `${dayFormatter.format(fromDate)} – …`
        : placeholder;

  const selectDay = (day: Date) => {
    if (!fromDate || (fromDate && toDate)) {
      onChange({ from: toISODate(day), to: '' });
      return;
    }
    if (day < fromDate) {
      onChange({ from: toISODate(day), to: '' });
      return;
    }
    onChange({ from: toISODate(fromDate), to: toISODate(day) });
    setOpen(false);
  };

  const clear = () => {
    onChange({ from: '', to: '' });
    setHoverDate(null);
  };

  const goToMonth = (delta: number) => {
    setViewMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    );
  };

  return (
    <BasePopover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setViewMonth(startOfMonth(fromDate ?? new Date()));
      }}
    >
      <BasePopover.Trigger
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-left text-[15px]',
          fromDate ? 'text-foreground' : 'text-muted-foreground/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        aria-label={`${fromLabel} – ${toLabel}`}
      >
        <CalendarDays
          size={16}
          className="shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span className="truncate">{triggerLabel}</span>
      </BasePopover.Trigger>

      <BasePopover.Portal>
        <BasePopover.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={16}
          className="z-50"
        >
          <BasePopover.Popup className="w-[min(320px,calc(100vw-2rem))] origin-[var(--transform-origin)] rounded-xl border border-border/85 bg-popover p-3 text-popover-foreground shadow-lg outline-none transition-[transform,opacity] duration-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex items-center justify-between px-1 pb-2">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                aria-label="Previous month"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/75 hover:text-foreground"
              >
                <ChevronLeft size={16} aria-hidden />
              </button>
              <span className="text-sm font-semibold capitalize">
                {monthFormatter.format(viewMonth)}
              </span>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                aria-label="Next month"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/75 hover:text-foreground"
              >
                <ChevronRight size={16} aria-hidden />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-muted-foreground/80">
              {weekdayLabels.map((label, i) => (
                <span key={i} className="flex h-7 items-center justify-center">
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {weeks.flatMap((week, weekIndex) =>
                week.map((day, dayIndex) => {
                  if (!day) {
                    return <span key={`${weekIndex}-${dayIndex}`} />;
                  }

                  const isStart = isSameDay(day, fromDate);
                  const isEnd = isSameDay(day, rangeEnd);
                  const inRange =
                    fromDate && rangeEnd && day > fromDate && day < rangeEnd;
                  const isToday = isSameDay(day, today);

                  return (
                    <button
                      key={toISODate(day)}
                      type="button"
                      onClick={() => selectDay(day)}
                      onMouseEnter={() => setHoverDate(day)}
                      onMouseLeave={() => setHoverDate(null)}
                      aria-pressed={isStart || isEnd}
                      aria-label={dayFormatter.format(day)}
                      aria-current={isToday ? 'date' : undefined}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-lg text-sm transition-colors',
                        inRange && 'bg-primary/10 text-foreground',
                        (isStart || isEnd) &&
                          'bg-primary text-primary-foreground font-semibold hover:bg-primary',
                        !isStart &&
                          !isEnd &&
                          !inRange &&
                          'hover:bg-secondary/75',
                        isToday &&
                          !isStart &&
                          !isEnd &&
                          'font-semibold text-primary',
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                }),
              )}
            </div>

            {fromDate ? (
              <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-2">
                <span className="text-xs text-muted-foreground">
                  {fromLabel}: {dayFormatter.format(fromDate)}
                  {toDate
                    ? ` · ${toLabel}: ${dayFormatter.format(toDate)}`
                    : ''}
                </span>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                >
                  {clearLabel}
                </button>
              </div>
            ) : null}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
