import { Check, Landmark, Lock } from 'lucide-react';

import { cn } from '@/utils/classNames';

/*
 * The three small pictures on the how-it-works cards, drawn in HTML/SVG so they follow the theme
 * and can't overclaim. Every figure in them is an example (and says so). The sponsor's stream is
 * `public`, the saver's is `private`, vested is `ok`: always beside a label, never colour alone.
 */

type RulesVisualProps = {
  labels: {
    example: string;
    locked: string;
    rate: string;
    cap: string;
    vesting: string;
    months: string;
  };
};

/** 1 · Fund: the pool's rules, set once by the sponsor and locked. */
export function RulesVisual({ labels }: RulesVisualProps) {
  const rows = [
    { term: labels.rate, value: '1 : 1' },
    { term: labels.cap, value: '500 SPYx' },
    { term: labels.vesting, value: labels.months },
  ];

  return (
    <div className="w-full max-w-64 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-public">
          <Landmark className="size-3.5" aria-hidden />
          <span className="font-mono-ui tracking-wide text-muted-foreground uppercase">
            {labels.example}
          </span>
        </span>
        <span className="flex items-center gap-1 rounded-full bg-public/10 px-2 py-0.5 font-medium text-public">
          <Lock className="size-3" aria-hidden />
          {labels.locked}
        </span>
      </div>
      <dl className="divide-y divide-border px-4">
        {rows.map((row) => (
          <div
            key={row.term}
            className="flex items-baseline justify-between gap-3 py-2.5 text-sm"
          >
            <dt className="text-muted-foreground">{row.term}</dt>
            <dd className="font-mono-ui font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type MergeVisualProps = {
  labels: { you: string; match: string; reserved: string };
};

// Fixed-size drawing (264×160): the chips sit on the same pixel grid as the lines.
const STREAM_LINES = [
  { d: 'M 56 44 C 56 84, 132 72, 132 112', tone: 'stroke-private' },
  { d: 'M 208 44 C 208 84, 132 72, 132 112', tone: 'stroke-public' },
] as const;

/** 2 · Deposit: your deposit and the match flow into one position, in one transaction. */
export function MergeVisual({ labels }: MergeVisualProps) {
  const chip =
    'absolute top-3 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium whitespace-nowrap shadow-xs';

  return (
    <div className="relative h-40 w-66">
      <svg
        aria-hidden
        width="264"
        height="160"
        viewBox="0 0 264 160"
        className="absolute inset-0"
        fill="none"
      >
        {STREAM_LINES.map((line) => (
          <path
            key={line.d}
            d={line.d}
            className={cn('flow-dash', line.tone)}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <span className={cn(chip, 'left-14')}>
        <span className="size-2 rounded-full bg-private" />
        {labels.you}
        <span className="font-mono-ui text-muted-foreground">100</span>
      </span>
      <span className={cn(chip, 'left-52')}>
        <span className="size-2 rounded-full bg-public" />
        {labels.match}
        <span className="font-mono-ui text-muted-foreground">100</span>
      </span>
      <span className="absolute top-28 left-33 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium whitespace-nowrap text-background shadow-md">
        <Check className="size-3.5 text-ok" aria-hidden />
        {labels.reserved}
      </span>
    </div>
  );
}

type VestVisualProps = {
  labels: { vested: string; month: string };
};

/** 3 · Vest: a straight line from nothing to the whole match; halfway through, half is yours. */
export function VestVisual({ labels }: VestVisualProps) {
  return (
    <div className="relative h-40 w-full max-w-72">
      <div className="wipe-in absolute inset-x-0 top-2 bottom-7">
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="size-full overflow-visible"
          fill="none"
        >
          <path d="M 0 100 L 100 0 L 100 100 Z" className="fill-ok/12" />
          <path
            d="M 0 100 L 100 0"
            className="stroke-ok"
            strokeWidth={2.5}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />
          <path
            d="M 0 100 L 100 100"
            className="stroke-border"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* Month 6 of 12: the point on the line, and what it means. */}
        <span className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-ok shadow-sm" />
        <span className="absolute bottom-1/2 left-1/2 mb-2.5 ml-2 rounded-full bg-card px-2.5 py-1 text-xs font-medium whitespace-nowrap shadow-sm ring-1 ring-border">
          <span className="text-ok-text">50%</span> {labels.vested}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono-ui text-xs text-muted-foreground">
        <span>0</span>
        <span>{labels.month}</span>
      </div>
    </div>
  );
}
