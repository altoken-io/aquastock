import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { BrandMark } from '../components/BrandMark';
import { ConfluenceRing } from '../components/ConfluenceRing';
import { color, easeInOut, easeOut, font } from '../theme';

// The title: two streams arrive from opposite banks, close into the ring around the AquaStock
// drop, and the bezel fills once. Everything after this is the product saying the same thing.

export const OPENING_DURATION = 180;

const RING = { x: 960, y: 380, size: 440, stroke: 22 };
const RADIUS = RING.size / 2 - RING.stroke / 2 - RING.size * 0.075;
const TOP_Y = RING.y - RADIUS;
const BOTTOM_Y = RING.y + RADIUS;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const strands = interpolate(frame, [0, 40], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const arcs = interpolate(frame, [36, 74], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const bezel = interpolate(frame, [48, 80], [0, 1], clamp);
  const vesting = interpolate(frame, [76, 132], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const mark = interpolate(frame, [56, 80], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const title = interpolate(frame, [74, 100], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const line = interpolate(frame, [96, 118], [0, 1], clamp);
  const meta = interpolate(frame, [114, 132], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: color.abyss }}>
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', inset: 0 }}
      >
        <path
          d={`M -40 150 C 420 150, 640 ${TOP_Y}, ${RING.x} ${TOP_Y}`}
          fill="none"
          stroke={color.sponsor}
          strokeWidth={10}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - strands}
        />
        <path
          d={`M 1960 620 C 1500 620, 1280 ${BOTTOM_Y}, ${RING.x} ${BOTTOM_Y}`}
          fill="none"
          stroke={color.saver}
          strokeWidth={10}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - strands}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: RING.x - RING.size / 2,
          top: RING.y - RING.size / 2,
        }}
      >
        <ConfluenceRing
          size={RING.size}
          strokeWidth={RING.stroke}
          progress={vesting}
          bezel={bezel}
          track={arcs}
          arcs={[
            { stream: 'sponsor', start: 0, share: 0.5, drawn: arcs },
            { stream: 'saver', start: 0.5, share: 0.5, drawn: arcs },
          ]}
        >
          <div style={{ opacity: mark, scale: `${0.8 + 0.2 * mark}` }}>
            <BrandMark size={132} />
          </div>
        </ConfluenceRing>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 660,
          width: '100%',
          textAlign: 'center',
          opacity: title,
          translate: `0px ${(1 - title) * 20}px`,
          fontFamily: font.display,
          fontSize: 112,
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: '-0.035em',
          color: color.text,
        }}
      >
        AquaStock <span style={{ color: color.muted }}>Match Pools</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 806,
          width: '100%',
          textAlign: 'center',
          opacity: line,
          fontFamily: font.sans,
          fontSize: 42,
          color: color.text,
        }}
      >
        The employer match, for people without an employer.
      </div>
      <div
        style={{
          position: 'absolute',
          top: 900,
          width: '100%',
          textAlign: 'center',
          opacity: meta,
          fontFamily: font.mono,
          fontSize: 20,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: color.muted,
        }}
      >
        Stocklana hackathon · Live on Solana devnet
      </div>
    </AbsoluteFill>
  );
};
