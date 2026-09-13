'use client';

import { useReducedMotion } from 'motion/react';

import { MotionDiv } from '@/components/helpers/motion/basic-lazy-motion';
import {
  AQUASTOCK_MARK_CURRENT_PATH,
  AQUASTOCK_MARK_DROP_PATH,
  AQUASTOCK_MARK_VIEWBOX,
} from '@aquastock/ui/brand/mark';

const RIPPLE_TRANSITION = {
  duration: 1.8,
  repeat: Infinity,
  ease: 'easeOut' as const,
};

/**
 * Next.js's file-based loading UI for this route segment — shown
 * automatically (via the Suspense boundary Next wraps around `page.tsx`)
 * while it resolves. Mirrors apps/web's loading.tsx so the mark reads the
 * same way across both apps.
 *
 * `DappShell` (header included) is rendered inside `page.tsx` rather than
 * `layout.tsx` today, so this fallback replaces the header too rather than
 * leaving it mounted — the right tradeoff while there's a single route; once
 * Day 1-3 nav lands and the shell moves to the layout, this will only need
 * to cover `<main>`.
 */
export default function Loading() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh w-full items-center justify-center bg-background"
    >
      <span className="sr-only">Loading AquaStock…</span>
      <div className="relative flex size-16 items-center justify-center">
        {!prefersReducedMotion && (
          <>
            <MotionDiv
              className="absolute inset-0 rounded-full border border-primary/50"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={RIPPLE_TRANSITION}
            />
            <MotionDiv
              className="absolute inset-0 rounded-full border border-primary/50"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{ ...RIPPLE_TRANSITION, delay: 0.9 }}
            />
          </>
        )}
        <MotionDiv
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1] }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <svg
            viewBox={AQUASTOCK_MARK_VIEWBOX}
            width={40}
            height={40}
            className="text-primary"
            aria-hidden="true"
          >
            <path d={AQUASTOCK_MARK_DROP_PATH} fill="currentColor" />
            <path
              d={AQUASTOCK_MARK_CURRENT_PATH}
              fill="none"
              stroke="white"
              strokeOpacity={0.55}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </svg>
        </MotionDiv>
      </div>
    </div>
  );
}
