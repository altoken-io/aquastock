'use client';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useInView } from 'motion/react';

import { cn } from '@/utils/classNames';

type CounterProps = Readonly<{
  targetNumber: number;
  duration: number;
  decimals?: number;
  className?: string;
}>;

const MAX_DECIMALS = 6;

const inferDecimalPlaces = (value: number) => {
  if (Number.isInteger(value)) return 0;

  const [, decimal = ''] = value.toString().split('.');
  return Math.min(decimal.length, MAX_DECIMALS);
};

const Counter = ({
  targetNumber,
  duration,
  decimals,
  className,
}: CounterProps) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  // Normalize external inputs so animation logic stays deterministic and safe.
  const safeTargetNumber = Number.isFinite(targetNumber) ? targetNumber : 0;
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const decimalPlaces = useMemo(() => {
    const fallback = inferDecimalPlaces(safeTargetNumber);
    const requested = decimals ?? fallback;
    return Math.min(MAX_DECIMALS, Math.max(0, Math.trunc(requested)));
  }, [decimals, safeTargetNumber]);

  useEffect(() => {
    if (!isInView) return;

    const totalDuration = safeDuration;
    const from = 0;
    const to = safeTargetNumber;
    const delta = to - from;
    const startTime = performance.now();
    const precisionMultiplier = 10 ** decimalPlaces;
    let frame = 0;

    const tick = (now: number) => {
      const progress =
        totalDuration === 0
          ? 1
          : Math.min((now - startTime) / totalDuration, 1);

      // Ease-out gives a natural finish while keeping render work in one frame loop.
      const eased = 1 - (1 - progress) ** 3;
      const nextRaw = from + delta * eased;
      const nextRounded =
        Math.round(nextRaw * precisionMultiplier) / precisionMultiplier;

      // Avoid state writes when the rendered value does not change at the current precision.
      setCount((previous) =>
        previous === nextRounded ? previous : nextRounded,
      );

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }

      setCount(to);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [decimalPlaces, isInView, safeDuration, safeTargetNumber]);

  // Reuse one formatter instance per precision level instead of rebuilding each render.
  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }),
    [decimalPlaces],
  );

  const formattedCount = useMemo(
    () => numberFormatter.format(count),
    [count, numberFormatter],
  );

  return (
    <span ref={ref} className={cn(className)}>
      {formattedCount}
    </span>
  );
};

export default memo(Counter);
