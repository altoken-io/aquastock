import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { ConfluenceRing } from '../components/ConfluenceRing';
import { Statement } from '../components/Statement';
import { Tag } from '../components/Tag';
import { color, easeInOut, easeOut, font, MARGIN } from '../theme';

// How a pool works, drawn as the product draws it: the sponsor's match and the saver's deposit
// arrive from opposite banks and close into one ring; the bezel fills as the match vests; leaving
// early pulls the unvested match back up the sponsor's stream. The numbers are illustrative and
// labelled so.

export const MECHANISM_DURATION = 600;

const RING = { x: 1300, y: 540, size: 520, stroke: 22 };
// Radius of the arcs' centre line (ConfluenceRing geometry with a bezel).
const RADIUS = RING.size / 2 - RING.stroke / 2 - RING.size * 0.075;
const TOP = { x: RING.x, y: RING.y - RADIUS };
const BOTTOM = { x: RING.x, y: RING.y + RADIUS };

const SPONSOR_STRAND = `M 900 300 C 1060 300, 1160 ${TOP.y}, ${TOP.x} ${TOP.y}`;
const SAVER_STRAND = `M 1790 790 C 1620 790, 1460 ${BOTTOM.y}, ${BOTTOM.x} ${BOTTOM.y}`;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const LEDGER = [
  {
    stream: 'saver' as const,
    label: 'You get back',
    value: '40 SPYx',
    note: 'your whole deposit',
  },
  {
    stream: 'chain' as const,
    label: 'You keep',
    value: '10 SPYx',
    note: 'the vested match',
  },
  {
    stream: 'sponsor' as const,
    label: 'Back to the sponsor',
    value: '30 SPYx',
    note: 'the unvested match',
  },
];

export const Mechanism: React.FC = () => {
  const frame = useCurrentFrame();

  const sponsorIn = interpolate(frame, [0, 18], [0, 1], clamp);
  const sponsorStrand = interpolate(frame, [12, 56], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const ringIn = interpolate(frame, [36, 70], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const saverIn = interpolate(frame, [150, 166], [0, 1], clamp);
  const saverStrand = interpolate(frame, [158, 198], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  // Both arcs draw together: the match is reserved in the deposit's own transaction.
  const reserved = interpolate(frame, [196, 244], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const months = interpolate(frame, [300, 404], [0, 3], {
    ...clamp,
    easing: easeInOut,
  });
  const leave = interpolate(frame, [452, 506], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const returnTrip = interpolate(frame, [470, 540], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });

  const vested = (40 * months) / 12;
  // The sponsor's arc shrinks back towards its stream by the unvested share when the saver leaves.
  const sponsorShare = 0.5 * reserved * (1 - 0.75 * leave);

  const center =
    frame < 196
      ? { big: '1:1', small: 'match on every deposit' }
      : frame < 300
        ? { big: '40 + 40', small: 'deposit + match reserved' }
        : frame < 452
          ? {
              big: `${vested.toFixed(1)} of 40`,
              small: `match vested · month ${Math.floor(months + 1e-6)} of 12`,
            }
          : { big: '40 + 10', small: 'back to the saver' };

  return (
    <AbsoluteFill style={{ backgroundColor: color.abyss }}>
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', inset: 0 }}
      >
        <path
          d={SPONSOR_STRAND}
          fill="none"
          stroke={color.sponsor}
          strokeWidth={12}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - sponsorStrand}
        />
        <path
          d={SAVER_STRAND}
          fill="none"
          stroke={color.saver}
          strokeWidth={12}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - saverStrand}
        />
        {returnTrip > 0 && returnTrip < 1 ? (
          // The unvested match travelling back up to the sponsor.
          <path
            d={SPONSOR_STRAND}
            fill="none"
            stroke={color.text}
            strokeWidth={4}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="0.06 0.94"
            strokeDashoffset={-(1 - returnTrip) * 0.94}
          />
        ) : null}
      </svg>

      <div
        style={{
          position: 'absolute',
          left: RING.x - RING.size / 2,
          top: RING.y - RING.size / 2,
          opacity: ringIn,
          scale: `${0.94 + 0.06 * ringIn}`,
        }}
      >
        <ConfluenceRing
          size={RING.size}
          strokeWidth={RING.stroke}
          progress={months / 12}
          bezel={ringIn}
          arcs={[
            { stream: 'sponsor', start: 0, share: sponsorShare },
            { stream: 'saver', start: 0.5, share: 0.5 * reserved },
          ]}
        >
          <div
            style={{
              fontFamily: font.display,
              fontSize: 76,
              fontWeight: 500,
              letterSpacing: '-0.03em',
              color: color.text,
              lineHeight: 1,
            }}
          >
            {center.big}
          </div>
          <div
            style={{
              marginTop: 14,
              maxWidth: 300,
              fontFamily: font.mono,
              fontSize: 19,
              lineHeight: 1.4,
              color: color.muted,
            }}
          >
            {center.small}
          </div>
        </ConfluenceRing>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 880,
          top: 196,
          opacity: sponsorIn,
        }}
      >
        <Tag stream="sponsor">Sponsor</Tag>
        <div
          style={{
            marginTop: 12,
            fontFamily: font.mono,
            fontSize: 20,
            color: color.muted,
          }}
        >
          1:1 · up to 50 per saver · 12 months
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: MARGIN,
          top: 812,
          opacity: saverIn,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <Tag stream="saver">Saver</Tag>
        <div
          style={{
            marginTop: 12,
            fontFamily: font.mono,
            fontSize: 20,
            color: color.muted,
          }}
        >
          deposits 40 SPYx
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 880,
          top: 812,
          display: 'grid',
          gridTemplateColumns: '290px 150px auto',
          alignItems: 'baseline',
          rowGap: 16,
        }}
      >
        {LEDGER.map((row, index) => {
          const shown = interpolate(
            frame,
            [486 + index * 14, 504 + index * 14],
            [0, 1],
            { ...clamp, easing: easeOut },
          );
          const cell = {
            opacity: shown,
            translate: `${(1 - shown) * -12}px 0px`,
          };
          return [
            <div key={`${row.label}-label`} style={cell}>
              <Tag stream={row.stream} size={17}>
                {row.label}
              </Tag>
            </div>,
            <div
              key={`${row.label}-value`}
              style={{
                ...cell,
                fontFamily: font.display,
                fontSize: 32,
                color: color.text,
              }}
            >
              {row.value}
            </div>,
            <div
              key={`${row.label}-note`}
              style={{
                ...cell,
                fontFamily: font.sans,
                fontSize: 22,
                color: color.muted,
              }}
            >
              {row.note}
            </div>,
          ];
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          right: MARGIN,
          top: 72,
          fontFamily: font.mono,
          fontSize: 17,
          letterSpacing: '0.04em',
          color: color.muted,
          opacity: sponsorIn,
        }}
      >
        Illustrative numbers
      </div>

      <AbsoluteFill style={{ left: MARGIN, top: 300 }}>
        <Statement
          from={6}
          to={150}
          tag={{ stream: 'neutral', text: 'How a pool works' }}
          title="A sponsor funds a match"
          body="The rules are set once: the match rate, a cap per saver and how long it vests. The budget is locked in the pool."
          titleSize={68}
          width={660}
        />
        <Statement
          from={152}
          to={292}
          tag={{ stream: 'both', text: 'How a pool works' }}
          title="A saver deposits, and the match is reserved"
          body="In one transaction: 40 in from the saver, 40 set aside from the sponsor's budget."
          titleSize={68}
          width={660}
        />
        <Statement
          from={294}
          to={432}
          tag={{ stream: 'chain', text: 'How a pool works' }}
          title="It vests in a straight line"
          body="Month by month the match becomes the saver's. The deposit is theirs all along."
          titleSize={68}
          width={660}
        />
        <Statement
          from={434}
          tag={{ stream: 'saver', text: 'How a pool works' }}
          title="Leave early, and nobody is surprised"
          body="Withdraw at month 3, and the app shows what comes back and what is given up before you sign."
          titleSize={68}
          width={660}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
