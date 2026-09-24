import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { BrandMark } from '../components/BrandMark';
import { ConfluenceRing } from '../components/ConfluenceRing';
import { Tag } from '../components/Tag';
import { color, easeOut, font, MARGIN } from '../theme';

// Why this belongs on Solana, then where to try it. The fee figure is the recorded deposit's own
// (Solana Explorer, devnet, 24 Sep 2026).

export const CLOSING_DURATION = 600;

const REASONS = [
  {
    label: 'Token-2022',
    title: 'Where xStocks live',
    text: 'SPYx is a Token-2022 mint. The program respects its multiplier, pause, freeze and permanent delegate.',
  },
  {
    label: 'Fees',
    title: 'Small enough for a $5 saver',
    text: 'The deposit in this video paid a network fee of 0.000005 SOL.',
  },
  {
    label: 'Always on',
    title: 'Markets never close',
    text: 'Deposits, claims and withdrawals settle in seconds, any day, any hour.',
  },
  {
    label: 'Enforced',
    title: 'A program, not a promise',
    text: "The match sits in the pool's vault and pays out by rules anyone can read.",
  },
];

const LINKS = [
  { label: 'Try it on devnet', value: 'aquastock-dapp.vercel.app/en/pools' },
  { label: 'Read the code', value: 'github.com/altoken-io/aquastock' },
  {
    label: 'Next',
    value:
      'USDC matches priced by Pyth · sponsor allow-lists · more index tokens',
  },
];

const WHY_END = 300;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const whyOut = interpolate(frame, [WHY_END - 14, WHY_END], [1, 0], clamp);
  const endIn = (from: number) =>
    interpolate(frame, [WHY_END + from, WHY_END + from + 20], [0, 1], {
      ...clamp,
      easing: easeOut,
    });
  const ring = interpolate(frame, [WHY_END, WHY_END + 60], [0, 1], {
    ...clamp,
    easing: easeOut,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: color.abyss }}>
      {frame < WHY_END ? (
        <AbsoluteFill style={{ padding: `110px ${MARGIN}px`, opacity: whyOut }}>
          <div style={{ opacity: interpolate(frame, [0, 14], [0, 1], clamp) }}>
            <Tag stream="neutral">Why Solana</Tag>
          </div>
          <div
            style={{
              marginTop: 64,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 120,
              rowGap: 80,
            }}
          >
            {REASONS.map((reason, index) => {
              const from = 12 + index * 26;
              const shown = interpolate(frame, [from, from + 20], [0, 1], {
                ...clamp,
                easing: easeOut,
              });
              return (
                <div
                  key={reason.label}
                  style={{
                    opacity: shown,
                    translate: `0px ${(1 - shown) * 16}px`,
                    borderTop: `1px solid ${color.rule}`,
                    paddingTop: 28,
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
                    {reason.label}
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      fontFamily: font.display,
                      fontSize: 58,
                      fontWeight: 500,
                      lineHeight: 1.04,
                      letterSpacing: '-0.025em',
                      color: color.text,
                    }}
                  >
                    {reason.title}
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      fontFamily: font.sans,
                      fontSize: 29,
                      lineHeight: 1.42,
                      color: color.muted,
                    }}
                  >
                    {reason.text}
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ padding: `0 ${MARGIN}px` }}>
          <div
            style={{
              position: 'absolute',
              left: MARGIN,
              top: 150,
              display: 'flex',
              alignItems: 'center',
              gap: 48,
            }}
          >
            <div style={{ opacity: ring }}>
              <ConfluenceRing
                size={220}
                strokeWidth={12}
                progress={ring}
                arcs={[
                  { stream: 'sponsor', start: 0, share: 0.5, drawn: ring },
                  { stream: 'saver', start: 0.5, share: 0.5, drawn: ring },
                ]}
              >
                <BrandMark size={64} />
              </ConfluenceRing>
            </div>
            <div
              style={{
                opacity: endIn(6),
                translate: `0px ${(1 - endIn(6)) * 16}px`,
              }}
            >
              <div
                style={{
                  fontFamily: font.display,
                  fontSize: 104,
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: '-0.035em',
                  color: color.text,
                }}
              >
                AquaStock{' '}
                <span style={{ color: color.muted }}>Match Pools</span>
              </div>
              <div
                style={{
                  marginTop: 20,
                  fontFamily: font.sans,
                  fontSize: 38,
                  color: color.muted,
                }}
              >
                The employer match, for people without an employer.
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: MARGIN,
              top: 500,
              display: 'grid',
              gridTemplateColumns: '360px auto',
              rowGap: 30,
              alignItems: 'baseline',
            }}
          >
            {LINKS.map((link, index) => {
              const shown = endIn(30 + index * 16);
              return [
                <div
                  key={`${link.label}-label`}
                  style={{
                    opacity: shown,
                    fontFamily: font.mono,
                    fontSize: 20,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: color.muted,
                  }}
                >
                  {link.label}
                </div>,
                <div
                  key={`${link.label}-value`}
                  style={{
                    opacity: shown,
                    fontFamily: index === 2 ? font.sans : font.mono,
                    fontSize: index === 2 ? 36 : 40,
                    color: index === 2 ? color.text : color.reservoir,
                  }}
                >
                  {link.value}
                </div>,
              ];
            })}
          </div>

          <div
            style={{
              position: 'absolute',
              left: MARGIN,
              right: MARGIN,
              bottom: 96,
              paddingTop: 28,
              borderTop: `1px solid ${color.rule}`,
              opacity: endIn(84),
              fontFamily: font.mono,
              fontSize: 19,
              letterSpacing: '0.06em',
              color: color.muted,
            }}
          >
            Built for Stocklana by the DDPay team · Demo on Solana devnet ·
            Unaudited · Not an offer of securities
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
