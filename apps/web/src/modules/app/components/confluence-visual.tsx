'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';

import { cn } from '@/utils/classNames';

// Heavy WebGL component — loaded only on the client, only when this panel is
// actually rendered (see rules/bundle-dynamic-imports in the Vercel React
// best-practices skill).
const Strands = dynamic(
  () => import('@aquastock/animation/ogl/components').then((m) => m.Strands),
  { ssr: false },
);

// Static approximations of the --public / --private / --primary tokens
// (globals.css) in sRGB hex — OGL's color pipeline can't parse oklch().
const ANCHOR_NAVY = '#33436b';
const TERRA_TERRACOTTA = '#c1683f';
const RESERVOIR_TEAL = '#5fb3c4';

type ConfluenceVisualProps = {
  className?: string;
  /** Renders a static fallback instead of mounting the WebGL canvas. */
  caption?: string;
};

/**
 * The brand's signature visual: two colored currents (the government/public
 * position and the community/private position) flowing together into one —
 * "The Confluence" from apps/dapp/DESIGN.md, given a form on the marketing
 * site. Falls back to a static gradient for prefers-reduced-motion.
 */
export function ConfluenceVisual({
  className,
  caption,
}: ConfluenceVisualProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-3xl bg-neutral-950',
        className,
      )}
    >
      {prefersReducedMotion ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${ANCHOR_NAVY} 0%, ${RESERVOIR_TEAL} 50%, ${TERRA_TERRACOTTA} 100%)`,
            opacity: 0.5,
          }}
        />
      ) : (
        <Strands
          colors={[ANCHOR_NAVY, TERRA_TERRACOTTA, RESERVOIR_TEAL]}
          count={3}
          speed={0.45}
          amplitude={1.1}
          waviness={0.9}
          thickness={0.8}
          glow={2.2}
          taper={2.4}
          spread={1.1}
          intensity={0.7}
          saturation={1.3}
          scale={1.6}
          className="absolute inset-0"
        />
      )}
      {caption && (
        <p className="absolute bottom-4 left-4 right-4 font-body text-xs text-white/70">
          {caption}
        </p>
      )}
    </div>
  );
}
