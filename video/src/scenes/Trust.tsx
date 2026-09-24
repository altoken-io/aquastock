import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { BrowserPlate } from '../components/BrowserPlate';
import { Statement } from '../components/Statement';
import { appHost, shot } from '../lib/capture';
import { color, easeInOut, easeOut, font, MARGIN } from '../theme';

// Honesty about the asset, next to the real card that says it in the app.

export const TRUST_DURATION = 510;

const ISSUER = shot('pool-issuer');

const POINTS = [
  {
    label: 'The issuer',
    text: "dSPYx's issuer can pause transfers, freeze accounts and move tokens out of any account, the pool's vault included. The pool page reads those powers live from the chain.",
  },
  {
    label: 'The program',
    text: "8 instructions and 33 tests, including randomized accounting checks. Unaudited. The team's deploy wallet can upgrade it, and the app says so.",
  },
  {
    label: 'The demo',
    text: 'Devnet only, with demo tokens that have no value. Not an offer of securities.',
  },
];

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Trust: React.FC = () => {
  const frame = useCurrentFrame();
  const plateIn = interpolate(frame, [4, 26], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const zoom = interpolate(frame, [20, 200], [1.3, 1.75], {
    ...clamp,
    easing: easeInOut,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: color.abyss }}>
      <AbsoluteFill style={{ left: MARGIN, top: 110 }}>
        <Statement
          from={0}
          tag={{ stream: 'neutral', text: 'What you actually own' }}
          title="Honest about the asset"
          titleSize={68}
          width={700}
        />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: 330,
          width: 690,
          display: 'flex',
          flexDirection: 'column',
          gap: 34,
        }}
      >
        {POINTS.map((point, index) => {
          const from = 40 + index * 70;
          const shown = interpolate(frame, [from, from + 18], [0, 1], {
            ...clamp,
            easing: easeOut,
          });
          return (
            <div
              key={point.label}
              style={{
                opacity: shown,
                translate: `0px ${(1 - shown) * 14}px`,
                paddingLeft: 24,
                borderLeft: `3px solid ${index === 2 ? color.reservoir : color.warning}`,
              }}
            >
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 18,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: color.muted,
                }}
              >
                {point.label}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: font.sans,
                  fontSize: 29,
                  lineHeight: 1.42,
                  color: color.text,
                }}
              >
                {point.text}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          right: MARGIN,
          top: 150,
          opacity: plateIn,
          translate: `${(1 - plateIn) * 24}px 0px`,
        }}
      >
        <BrowserPlate
          width={960}
          layers={[{ file: ISSUER.file, opacity: 1 }]}
          camera={{ zoom, x: 350, y: 610 }}
          host={appHost}
          path={ISSUER.path}
        />
      </div>
    </AbsoluteFill>
  );
};
