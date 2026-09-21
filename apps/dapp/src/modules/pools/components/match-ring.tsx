import type { ReactNode } from 'react';

import { cn } from '@/utils/classNames';

export interface RingSegment {
  /** Sponsor match (Anchor navy) or the saver's own savings (Terra). */
  token: 'sponsor' | 'saver';
  value: number;
}

interface MatchRingProps {
  segments: RingSegment[];
  /**
   * What a full circle stands for. When given, segments fill only their share and the rest
   * stays as track (pool capacity). When omitted, the segments split the whole circle.
   */
  capacity?: number;
  /** 0..1: how far the match has vested. Draws the bezel of ticks, filled clockwise. */
  progress?: number;
  size?: number;
  strokeWidth?: number;
  /** Accessible description of what the ring shows. */
  label: string;
  /** Draw the arcs in once when the ring first appears. For hero rings only. */
  animateIn?: boolean;
  className?: string;
  children?: ReactNode;
}

const TICKS = 60;
const STROKES = {
  sponsor: 'var(--public)',
  saver: 'var(--private)',
} as const;

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * The Confluence: two streams, the sponsor's match and your own savings, closing into one
 * ring. The bezel of ticks around it fills as the match vests, so time is visible on the
 * same instrument as the money. Colour is never the only carrier of meaning: the legend
 * beside every ring names each stream with an icon and a label.
 *
 * Pure SVG, so it renders on the server. Arcs animate with a CSS transition that is switched
 * off for `prefers-reduced-motion`.
 */
export function MatchRing({
  segments,
  capacity,
  progress,
  size = 220,
  strokeWidth = 16,
  label,
  animateIn = false,
  className,
  children,
}: MatchRingProps) {
  const center = size / 2;
  const hasBezel = progress !== undefined;
  const bezelInset = hasBezel ? 4 : 0;
  const radius = center - strokeWidth / 2 - (hasBezel ? 18 : 2);
  const circumference = 2 * Math.PI * radius;

  const positive = segments.filter((segment) => segment.value > 0);
  const total = capacity ?? positive.reduce((sum, s) => sum + s.value, 0);
  const gap = positive.length > 1 ? Math.min(circumference * 0.02, 6) : 0;

  const shares = positive.map((segment) =>
    total > 0 ? Math.min(segment.value / total, 1) : 0,
  );
  const arcs = positive.map((segment, index) => {
    const share = shares[index] ?? 0;
    const before = shares.slice(0, index).reduce((sum, s) => sum + s, 0);
    return {
      token: segment.token,
      length: Math.max(circumference * share - gap, 0),
      start: circumference * before,
    };
  });

  const filled = hasBezel
    ? Math.round(Math.min(Math.max(progress, 0), 1) * TICKS)
    : 0;
  const tickOuter = center - bezelInset;
  const tickInner = center - bezelInset - 9;

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        className,
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        aria-hidden="true"
      >
        {hasBezel &&
          Array.from({ length: TICKS }, (_, index) => {
            const angle = (index / TICKS) * 2 * Math.PI - Math.PI / 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return (
              <line
                key={index}
                x1={round(center + cos * tickInner)}
                y1={round(center + sin * tickInner)}
                x2={round(center + cos * tickOuter)}
                y2={round(center + sin * tickOuter)}
                strokeWidth={index % 5 === 0 ? 2.5 : 1.5}
                strokeLinecap="round"
                className="transition-colors duration-300 motion-reduce:transition-none"
                stroke={index < filled ? 'var(--ok)' : 'var(--border)'}
                strokeOpacity={index < filled ? 1 : 0.9}
              />
            );
          })}
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeOpacity={0.55}
            strokeWidth={strokeWidth}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.token}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={STROKES[arc.token]}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${round(arc.length)} ${round(circumference)}`}
              strokeDashoffset={-round(arc.start + gap / 2)}
              className={cn(
                'transition-[stroke-dasharray,stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none',
                animateIn && 'dapp-arc-in duration-700',
              )}
            />
          ))}
        </g>
      </svg>
      {children ? (
        <div className="relative flex max-w-[62%] flex-col items-center justify-center text-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}
