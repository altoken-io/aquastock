import { color } from '../theme';

// The dApp's signature instrument (apps/dapp/src/modules/pools/components/match-ring.tsx),
// redrawn for video: the same geometry, driven by props a scene interpolates per frame instead
// of CSS transitions. Two arcs, the sponsor's match and the saver's own savings, close into one
// ring; a bezel of 60 ticks fills as the match vests.

const TICKS = 60;
const round = (value: number) => Math.round(value * 100) / 100;

export interface RingArc {
  stream: 'sponsor' | 'saver';
  /** Share of the full circle, 0..1. */
  share: number;
  /** Where the arc starts, as a share of the circle measured clockwise from 12 o'clock. */
  start: number;
  /** 0..1: how much of the arc is drawn, for the draw-in. */
  drawn?: number;
  opacity?: number;
}

export const ConfluenceRing: React.FC<{
  size: number;
  strokeWidth?: number;
  arcs: RingArc[];
  /** 0..1 of the match vested; omit for no bezel. */
  progress?: number;
  /** 0..1: how far the bezel itself has appeared. */
  bezel?: number;
  track?: number;
  /** Where arc shares are measured from, in degrees; -90 is 12 o'clock, 180 is 9 o'clock. */
  rotation?: number;
  children?: React.ReactNode;
}> = ({
  size,
  strokeWidth = 22,
  arcs,
  progress,
  bezel = 1,
  track = 1,
  rotation = -90,
  children,
}) => {
  const center = size / 2;
  const hasBezel = progress !== undefined;
  const radius = center - strokeWidth / 2 - (hasBezel ? size * 0.075 : 2);
  const circumference = 2 * Math.PI * radius;
  const gap = Math.min(circumference * 0.012, 8);
  const filled = hasBezel ? Math.min(Math.max(progress, 0), 1) * TICKS : 0;
  const tickOuter = center - 2;
  const tickInner = center - size * 0.045;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        {hasBezel
          ? Array.from({ length: TICKS }, (_, index) => {
              const angle = (index / TICKS) * 2 * Math.PI - Math.PI / 2;
              const cos = Math.cos(angle);
              const sin = Math.sin(angle);
              // A tick fills in once the vesting has passed it; the one being crossed fades in.
              const fill = Math.min(Math.max(filled - index, 0), 1);
              const appear = Math.min(Math.max(bezel * TICKS - index, 0), 1);
              return (
                <g key={index} opacity={appear}>
                  <line
                    x1={round(center + cos * tickInner)}
                    y1={round(center + sin * tickInner)}
                    x2={round(center + cos * tickOuter)}
                    y2={round(center + sin * tickOuter)}
                    stroke={color.rule}
                    strokeWidth={index % 5 === 0 ? 3.5 : 2}
                    strokeLinecap="round"
                  />
                  <line
                    x1={round(center + cos * tickInner)}
                    y1={round(center + sin * tickInner)}
                    x2={round(center + cos * tickOuter)}
                    y2={round(center + sin * tickOuter)}
                    stroke={color.ok}
                    strokeOpacity={fill}
                    strokeWidth={index % 5 === 0 ? 3.5 : 2}
                    strokeLinecap="round"
                  />
                </g>
              );
            })
          : null}
        <g transform={`rotate(${rotation} ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color.rule}
            strokeOpacity={0.9 * track}
            strokeWidth={strokeWidth}
          />
          {arcs.map((arc) => {
            const length = Math.max(
              circumference * arc.share * (arc.drawn ?? 1) - gap,
              0,
            );
            return (
              <circle
                key={arc.stream}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={arc.stream === 'sponsor' ? color.sponsor : color.saver}
                strokeOpacity={arc.opacity ?? 1}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${round(length)} ${round(circumference)}`}
                strokeDashoffset={-round(circumference * arc.start + gap / 2)}
              />
            );
          })}
        </g>
      </svg>
      {children ? (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};
