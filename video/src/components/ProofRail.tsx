import { Easing, interpolate } from 'remotion';

import { short } from '../lib/capture';
import { color, easeOut, font } from '../theme';

// The video's signature: two strands, the sponsor's and the savers', that run under the demo and
// collect each real transaction as it happens. A deposit ties the strands together (the match is
// reserved from the sponsor's budget for that saver); a withdrawal sends the unvested match back
// up to the sponsor. By the end of the demo the rail is a ledger of real devnet signatures.

export interface RailEvent {
  /** Frame on the rail's own timeline. */
  at: number;
  strand: 'sponsor' | 'saver';
  kind: 'create' | 'deposit' | 'withdraw' | 'claim';
  instruction: string;
  who: string;
  signature: string;
}

const WIDTH = 1728;
const LABEL_COLUMN = 150;
const SPONSOR_Y = 70;
const SAVER_Y = 132;
const START = LABEL_COLUMN + 20;
const END = WIDTH;

export const ProofRail: React.FC<{
  events: RailEvent[];
  frame: number;
  duration: number;
  /** 0..1, for the rail's own entrance. */
  enter: number;
}> = ({ events, frame, duration, enter }) => {
  const slots = events.map(
    (_, index) =>
      START + 150 + ((END - 260 - START - 150) * index) / (events.length - 1),
  );
  // The strands' head reaches each slot exactly when its transaction lands.
  const head = interpolate(
    frame,
    [0, ...events.map((event) => event.at), duration],
    [START, ...slots, END],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const strandLength = (head - START) * enter;

  return (
    <div
      style={{
        position: 'relative',
        width: WIDTH,
        height: 200,
        opacity: enter,
      }}
    >
      <svg
        width={WIDTH}
        height={200}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        {(['sponsor', 'saver'] as const).map((strand) => {
          const y = strand === 'sponsor' ? SPONSOR_Y : SAVER_Y;
          const stroke = strand === 'sponsor' ? color.sponsor : color.saver;
          return (
            <g key={strand}>
              <line
                x1={START}
                y1={y}
                x2={END}
                y2={y}
                stroke={color.rule}
                strokeWidth={2}
              />
              <line
                x1={START}
                y1={y}
                x2={START + strandLength}
                y2={y}
                stroke={stroke}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <circle cx={START + strandLength} cy={y} r={5} fill={stroke} />
            </g>
          );
        })}
        {events.map((event, index) => {
          const x = slots[index] ?? START;
          const shown = interpolate(frame, [event.at, event.at + 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: easeOut,
          });
          if (shown === 0) return null;
          const y = event.strand === 'sponsor' ? SPONSOR_Y : SAVER_Y;
          const stroke =
            event.kind === 'claim'
              ? color.ok
              : event.strand === 'sponsor'
                ? color.sponsor
                : color.saver;
          const tie = interpolate(shown, [0.2, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.quad),
          });
          const span = SAVER_Y - SPONSOR_Y - 28;
          return (
            <g key={event.signature}>
              {event.kind === 'deposit' ? (
                // Match meets savings: the tie is half sponsor, half saver.
                <>
                  <line
                    x1={x}
                    y1={SPONSOR_Y + 14}
                    x2={x}
                    y2={SPONSOR_Y + 14 + (span / 2) * tie}
                    stroke={color.sponsor}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <line
                    x1={x}
                    y1={SAVER_Y - 14}
                    x2={x}
                    y2={SAVER_Y - 14 - (span / 2) * tie}
                    stroke={color.saver}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                </>
              ) : null}
              {event.kind === 'withdraw' ? (
                // The unvested match goes back up to the sponsor.
                <g opacity={tie}>
                  <line
                    x1={x}
                    y1={SAVER_Y - 14}
                    x2={x}
                    y2={SAVER_Y - 14 - span * tie}
                    stroke={color.sponsor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray="2 7"
                  />
                  <path
                    d={`M ${x - 7} ${SPONSOR_Y + 22} L ${x} ${SPONSOR_Y + 14} L ${x + 7} ${SPONSOR_Y + 22}`}
                    fill="none"
                    stroke={color.sponsor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              ) : null}
              <circle
                cx={x}
                cy={y}
                r={11 * shown}
                fill={color.abyss}
                stroke={stroke}
                strokeWidth={3}
              />
              <circle cx={x} cy={y} r={5 * shown} fill={stroke} />
            </g>
          );
        })}
      </svg>

      {(['sponsor', 'saver'] as const).map((strand) => (
        <div
          key={strand}
          style={{
            position: 'absolute',
            left: 0,
            top: (strand === 'sponsor' ? SPONSOR_Y : SAVER_Y) - 11,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: font.mono,
            fontSize: 17,
            letterSpacing: '0.12em',
            color: strand === 'sponsor' ? color.sponsor : color.saver,
          }}
        >
          {strand === 'sponsor' ? 'SPONSOR' : 'SAVERS'}
        </div>
      ))}

      {events.map((event, index) => {
        const x = slots[index] ?? START;
        const shown = interpolate(
          frame,
          [event.at + 4, event.at + 20],
          [0, 1],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: easeOut,
          },
        );
        if (shown === 0) return null;
        const above = event.strand === 'sponsor';
        return (
          <div
            key={event.signature}
            style={{
              position: 'absolute',
              left: x - 170,
              width: 340,
              top: above ? SPONSOR_Y - 66 : SAVER_Y + 20,
              textAlign: 'center',
              opacity: shown,
              translate: `0px ${(1 - shown) * (above ? 8 : -8)}px`,
              fontFamily: font.mono,
              lineHeight: 1.3,
            }}
          >
            <div style={{ fontSize: 20, color: color.text }}>
              {event.instruction}
            </div>
            <div style={{ fontSize: 16, color: color.muted }}>
              {event.who} · {short(event.signature)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
