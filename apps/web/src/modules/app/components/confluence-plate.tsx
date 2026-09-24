import type { CSSProperties } from 'react';
import Image from 'next/image';

import confluence from '@/modules/app/assets/confluence.webp';
import { cn } from '@/utils/classNames';

/*
 * The hero's plate: an aerial photograph of two rivers meeting, a dark one and a sandy one, read
 * as the product's mechanism. The dark river is the sponsor's match, the sandy one is your
 * savings, they meet on deposit, and the seam between them runs downstream like vesting time.
 *
 * Pins are placed in the photograph's own coordinates (u, v in 0..1 of its 1672×941 frame) and
 * the SVG overlay uses the same viewBox with `slice`, which crops exactly like `object-cover`, so
 * both stay on the water at 16:9 and on the phone's 4:3 crop.
 */

// The seam between the two rivers, from where they meet down to the bottom edge.
const SEAM_PATH = 'M 800 262 C 845 420, 880 600, 1000 941';
// Points on that curve at t = 0, ¼, ½, ¾, 1: months 0, 3, 6, 9 and 12 of the vesting period.
const SEAM_TICKS = [
  [800, 262],
  [833, 387],
  [872, 533],
  [925, 713],
  [1000, 941],
] as const;

type Side = 'right' | 'left';

type Pin = {
  id: 'sponsor' | 'saver' | 'merge' | 'vest';
  u: number;
  v: number;
  side: Side;
  /** The stream's colour: always shown with its label, never alone. */
  dot: string;
  /** Stagger slot (`rise-N`) for the pin's entrance, after the headline. */
  delay: string;
};

const PINS: readonly Pin[] = [
  {
    id: 'sponsor',
    u: 0.26,
    v: 0.2,
    side: 'right',
    dot: 'bg-public',
    delay: 'rise-6',
  },
  {
    id: 'saver',
    u: 0.74,
    v: 0.1,
    side: 'left',
    dot: 'bg-private',
    delay: 'rise-7',
  },
  {
    id: 'merge',
    u: 0.478,
    v: 0.278,
    side: 'right',
    dot: 'bg-primary',
    delay: 'rise-9',
  },
  {
    id: 'vest',
    u: 0.553,
    v: 0.758,
    side: 'right',
    dot: 'bg-ok',
    delay: 'rise-12',
  },
];

// Custom properties for `.plate-pin` (globals.css), which maps them through the crop.
type PinStyle = CSSProperties & Record<'--u' | '--v', number>;
const pinStyle = (u: number, v: number): PinStyle => ({ '--u': u, '--v': v });

type ConfluencePlateProps = {
  alt: string;
  labels: Record<Pin['id'], string>;
  className?: string;
};

export function ConfluencePlate({
  alt,
  labels,
  className,
}: ConfluencePlateProps) {
  return (
    <figure className={className}>
      <div className="confluence-plate relative aspect-4/3 overflow-hidden rounded-plate bg-abyss shadow-2xl shadow-abyss/15 ring-1 ring-foreground/5 sm:aspect-video">
        <Image
          src={confluence}
          alt={alt}
          placeholder="blur"
          preload
          fetchPriority="high"
          sizes="(min-width: 80rem) 76rem, calc(100vw - 2rem)"
          className="size-full object-cover"
        />

        {/* A little depth at the edges, so white pins read on bright water too. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-radial from-transparent from-55% to-abyss/35"
        />

        <svg
          aria-hidden
          viewBox="0 0 1672 941"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full"
        >
          <path
            id="plate-seam"
            d={SEAM_PATH}
            pathLength={1}
            fill="none"
            className="plate-seam stroke-white/75"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <g className="animate-rise rise-11">
            {SEAM_TICKS.map(([cx, cy]) => (
              <circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r={7}
                className="fill-white"
              />
            ))}
          </g>
          {/* A drop drifting downstream: the match, vesting. */}
          <circle
            r={9}
            className="plate-drift fill-abyss-primary stroke-white"
            strokeWidth={3}
            opacity={0}
          >
            <animateMotion dur="9s" begin="3.6s" repeatCount="indefinite">
              <mpath href="#plate-seam" />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.1;0.85;1"
              dur="9s"
              begin="3.6s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        {PINS.map((pin, index) => (
          <span
            key={pin.id}
            className={cn('plate-pin animate-pop absolute size-0', pin.delay)}
            style={pinStyle(pin.u, pin.v)}
          >
            {/* The point itself: numbered on phones (see the legend below), a plain dot above. */}
            <span className="absolute top-0 left-0 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white font-mono-ui text-xs font-medium text-abyss ring-4 ring-white/30 sm:size-3 sm:ring-6">
              <span className="sm:hidden">{index + 1}</span>
            </span>
            <span
              className={cn(
                'absolute top-0 hidden -translate-y-1/2 items-center gap-2 rounded-full bg-white/92 py-1.5 pr-3.5 pl-2.5 text-sm font-medium whitespace-nowrap text-abyss shadow-lg shadow-abyss/20 backdrop-blur-sm sm:flex',
                pin.side === 'right' ? 'left-4' : 'right-4',
              )}
            >
              <span className={cn('size-2 rounded-full', pin.dot)} />
              {labels[pin.id]}
            </span>
          </span>
        ))}
      </div>

      {/* Phones: the pins are numbers, and this is their key. */}
      <ol className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground sm:hidden">
        {PINS.map((pin, index) => (
          <li key={pin.id} className="flex items-center gap-2">
            <span className="font-mono-ui text-xs text-foreground">
              {index + 1}
            </span>
            <span className={cn('size-2 shrink-0 rounded-full', pin.dot)} />
            {labels[pin.id]}
          </li>
        ))}
      </ol>
    </figure>
  );
}
