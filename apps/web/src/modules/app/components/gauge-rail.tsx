'use client';

import { useEffect, useState } from 'react';

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

import { cn } from '@/utils/classNames';

export type GaugeDatum = { id: string; label: string };

/**
 * Tracks which section id is currently most centered in the viewport, for
 * the gauge rail's active-datum highlight. Mirrors the header's own
 * scroll-aware behavior (`useIsScrolled`) but per-section rather than
 * boolean.
 */
function useActiveSectionId(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) setActiveId(mostVisible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

/**
 * The page's signature visual: a staff gauge — the kind used to read a
 * reservoir's water level — pinned to the margin, marked with each section's
 * datum instead of generic step numbers. A waterline rises inside it as the
 * page scrolls, making "capital you can see land" (see docs/TONE.md)
 * literal rather than a metaphor left to copy. Collapses to a slim
 * horizontal waterline under the header below the `xl` breakpoint, where
 * there's no margin to pin a vertical rail in.
 */
export function GaugeRail({ data }: { data: GaugeDatum[] }) {
  const ids = data.map((datum) => datum.id);
  const activeId = useActiveSectionId(ids);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(
    scrollYProgress,
    prefersReducedMotion
      ? { stiffness: 1000, damping: 100 }
      : { stiffness: 90, damping: 24, mass: 0.4 },
  );
  const fillHeight = useTransform(smoothProgress, [0, 1], ['0%', '100%']);
  const fillWidth = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 left-0 z-40 hidden w-20 xl:flex xl:flex-col xl:items-center xl:py-28"
      >
        <div className="relative flex h-full w-px flex-col items-center justify-between bg-border">
          <motion.div
            style={{ height: fillHeight }}
            className="absolute inset-x-0 bottom-0 w-px bg-primary"
          />
          {data.map((datum) => (
            <div key={datum.id} className="relative flex items-center">
              <span
                className={cn(
                  'absolute left-0 h-px w-2.5 -translate-x-full transition-colors duration-300',
                  datum.id === activeId ? 'bg-primary' : 'bg-border',
                )}
              />
              <span
                className={cn(
                  'font-mono-ui ml-4 origin-left -rotate-90 text-[10px] tracking-[0.24em] whitespace-nowrap uppercase transition-colors duration-300',
                  datum.id === activeId
                    ? 'font-medium text-primary'
                    : 'text-muted-foreground/45',
                )}
              >
                {datum.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-40 h-0.5 bg-border xl:hidden"
      >
        <motion.div
          style={{ width: fillWidth }}
          className="h-full bg-primary"
        />
      </div>
    </>
  );
}
