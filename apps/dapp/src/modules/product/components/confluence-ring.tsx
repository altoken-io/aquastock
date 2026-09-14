import { cn } from '@/utils/classNames';

type ConfluenceRingProps = {
  /** Government/anchor amount — rendered in the `public` (Anchor) token. */
  publicValue: number;
  /** Community/investor amount — rendered in the `private` (Terra) token. */
  privateValue: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  coreLabel?: string;
  coreValue?: string;
  /** Accessible name when the ring conveys real data, not decoration. */
  label?: string;
};

/**
 * The dApp's signature visual — see apps/dapp/DESIGN.md's "Confluence" north
 * star. Two arcs (government + community) always close into one ring: the
 * same idea rendered both as the hero's decorative mark and, at data-bound
 * sizes, as the actual public/private funding-split widget on project cards
 * and the project detail page. Distinct from apps/web's OGL "Strands"
 * visual, which stays that app's own expression of the same concept.
 */
export function ConfluenceRing({
  publicValue,
  privateValue,
  size = 160,
  strokeWidth = 14,
  className,
  coreLabel,
  coreValue,
  label,
}: ConfluenceRingProps) {
  const total = publicValue + privateValue;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const publicFraction = total > 0 ? publicValue / total : 0.5;
  const hasBothSides = publicValue > 0 && privateValue > 0;
  const gapLength = hasBothSides ? Math.min(circumference * 0.02, 8) : 0;
  const publicLength = Math.max(
    circumference * publicFraction - gapLength / 2,
    0,
  );
  const privateLength = Math.max(circumference - publicLength - gapLength, 0);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        className,
      )}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeOpacity={0.5}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--public)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${publicLength} ${circumference}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--private)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${privateLength} ${circumference}`}
          strokeDashoffset={-(publicLength + gapLength)}
        />
      </svg>
      {(coreLabel || coreValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
          {coreValue && (
            <span className="font-display text-lg font-semibold tabular-nums text-foreground">
              {coreValue}
            </span>
          )}
          {coreLabel && (
            <span className="px-2 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
              {coreLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
