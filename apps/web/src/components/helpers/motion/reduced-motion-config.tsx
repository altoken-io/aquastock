'use client';

import type { ReactNode } from 'react';

import { MotionConfig } from 'motion/react';

/**
 * Honors `prefers-reduced-motion` for every motion component beneath it —
 * entrance transforms collapse to a plain fade for users who asked for less
 * movement. Wrap a page's content in this rather than checking the media
 * query in each section.
 */
export const ReducedMotionConfig = ({ children }: { children: ReactNode }) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);
