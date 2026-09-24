import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import {
  BrowserPlate,
  CHROME_HEIGHT,
  toPlate,
  VIEWPORT,
} from '../components/BrowserPlate';
import { Cursor } from '../components/Cursor';
import { ProofRail } from '../components/ProofRail';
import { Tag } from '../components/Tag';
import { appHost, capture } from '../lib/capture';
import { color, easeOut, font, MARGIN } from '../theme';
import { TIMELINE } from './demo/beats';
import { cameraAt, sample } from './demo/timeline';

const INTRO = 84;
const PLATE_WIDTH = 1120;
const PLATE_SCALE = PLATE_WIDTH / VIEWPORT.width;
const PLATE_LEFT = 1920 - MARGIN - PLATE_WIDTH;
const PLATE_TOP = 64;
const CROSSFADE = 8;

export const DEMO_DURATION = INTRO + TIMELINE.duration + 36;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const recordedOn = new Date(capture.capturedAt).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** The chapter card: what the next minute is, and how it was recorded. */
const DemoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const out = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    clamp,
  );
  return (
    <AbsoluteFill
      style={{
        padding: `0 ${MARGIN}px`,
        justifyContent: 'center',
        opacity: out,
      }}
    >
      <div
        style={{
          opacity: interpolate(frame, [0, 16], [0, 1], clamp),
          translate: `0px ${interpolate(frame, [0, 22], [18, 0], { ...clamp, easing: easeOut })}px`,
        }}
      >
        <Tag stream="chain" size={24}>
          Live on Solana devnet
        </Tag>
        <div
          style={{
            marginTop: 28,
            fontFamily: font.display,
            fontSize: 104,
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: color.text,
          }}
        >
          The real app, on devnet
        </div>
        <div
          style={{
            marginTop: 32,
            maxWidth: 1180,
            fontFamily: font.sans,
            fontSize: 36,
            lineHeight: 1.4,
            color: color.muted,
            opacity: interpolate(frame, [10, 28], [0, 1], clamp),
          }}
        >
          Recorded on {recordedOn} at {appHost}, the app anyone can open. A
          scripted test wallet signs each step; Phantom or Solflare would ask
          you to approve it.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DemoMain: React.FC = () => {
  const frame = useCurrentFrame();
  const { steps, beats, clicks, events, duration } = TIMELINE;

  const stepIndex = Math.max(
    0,
    steps.findIndex((step) => frame >= step.start && frame < step.end),
  );
  const current =
    frame >= duration ? steps[steps.length - 1] : steps[stepIndex];
  if (!current) return null;
  const previous = steps[steps.indexOf(current) - 1];
  const fadeIn = previous
    ? interpolate(
        frame,
        [current.start, current.start + CROSSFADE],
        [0, 1],
        clamp,
      )
    : 1;
  const layers = [
    ...(previous && fadeIn < 1 ? [{ file: previous.file, opacity: 1 }] : []),
    { file: current.file, opacity: fadeIn },
  ];

  const camera = cameraAt(TIMELINE, frame);
  const [cx = 0, cy = 0] = sample(TIMELINE.cursor, frame);
  const pointer = toPlate({ x: cx, y: cy }, camera, PLATE_SCALE);
  const cursorShown = interpolate(
    frame,
    [current.start, current.start + 8],
    current.cursor === false ? [1, 0] : [0, 1],
    clamp,
  );
  const cursorOpacity =
    current.cursor === false
      ? previous?.cursor === false
        ? 0
        : cursorShown
      : previous?.cursor === false
        ? cursorShown
        : 1;
  const click = clicks.find(
    (c) => frame >= c.frame - 3 && frame <= c.frame + 18,
  );
  const press = click
    ? interpolate(
        frame,
        [click.frame - 3, click.frame, click.frame + 5],
        [0, 1, 0],
        clamp,
      )
    : 0;
  const ripple =
    click && frame >= click.frame ? (frame - click.frame) / 18 : null;

  const beat =
    beats.find((b) => frame >= b.start && frame < b.end) ??
    beats[beats.length - 1];
  const isExplorer = current.file.includes('explorer');
  const badgeOpacity = current.badge
    ? interpolate(frame, [current.start + 4, current.start + 12], [0, 1], clamp)
    : 0;
  const enter = interpolate(frame, [0, 18], [0, 1], {
    ...clamp,
    easing: easeOut,
  });

  return (
    <AbsoluteFill>
      {beat ? (
        <div
          key={beat.start}
          style={{
            position: 'absolute',
            left: MARGIN,
            top: 96,
            width: PLATE_LEFT - MARGIN - 56,
            opacity:
              interpolate(frame, [beat.start, beat.start + 16], [0, 1], clamp) *
              (beat === beats[beats.length - 1]
                ? 1
                : interpolate(frame, [beat.end - 10, beat.end], [1, 0], clamp)),
            translate: `0px ${interpolate(frame, [beat.start, beat.start + 20], [14, 0], { ...clamp, easing: easeOut })}px`,
          }}
        >
          <Tag stream={beat.stream}>{beat.tag}</Tag>
          <div
            style={{
              marginTop: 24,
              fontFamily: font.display,
              fontSize: 58,
              fontWeight: 500,
              lineHeight: 1.04,
              letterSpacing: '-0.025em',
              color: color.text,
            }}
          >
            {beat.title}
          </div>
          <div
            style={{
              marginTop: 24,
              fontFamily: font.sans,
              fontSize: 29,
              lineHeight: 1.42,
              color: color.muted,
            }}
          >
            {beat.body}
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: 700,
          fontFamily: font.mono,
          fontSize: 16,
          lineHeight: 1.55,
          letterSpacing: '0.04em',
          color: color.muted,
          opacity: enter,
        }}
      >
        Recorded on Solana devnet, {recordedOn}
        <br />
        Pool {capture.pool.address.slice(0, 4)}…{capture.pool.address.slice(-4)}{' '}
        · scripted test wallet
      </div>

      <div
        style={{
          position: 'absolute',
          left: PLATE_LEFT,
          top: PLATE_TOP,
          opacity: enter,
          translate: `0px ${(1 - enter) * 24}px`,
        }}
      >
        <BrowserPlate
          width={PLATE_WIDTH}
          layers={layers}
          camera={camera}
          host={isExplorer ? 'explorer.solana.com' : appHost}
          path={isExplorer ? `${current.path}?cluster=devnet` : current.path}
        >
          {current.badge ? (
            <div
              style={{
                position: 'absolute',
                right: 18,
                top: CHROME_HEIGHT + 18,
                padding: '10px 16px',
                borderRadius: 10,
                backgroundColor: color.abyss,
                fontFamily: font.mono,
                fontSize: 20,
                color: color.text,
                opacity: badgeOpacity,
                boxShadow: `0 0 0 1px ${color.rule}`,
              }}
            >
              <span style={{ color: color.ok }}>●</span> {current.badge}
            </div>
          ) : null}
          <Cursor
            x={pointer.x}
            y={pointer.y}
            press={press}
            ripple={ripple}
            opacity={cursorOpacity}
          />
        </BrowserPlate>
      </div>

      <div style={{ position: 'absolute', left: MARGIN, top: 842 }}>
        <ProofRail
          events={events}
          frame={frame}
          duration={duration}
          enter={enter}
        />
      </div>
    </AbsoluteFill>
  );
};

/**
 * The working product: the recorded devnet run, beat by beat, with the Proof Rail collecting
 * each real transaction underneath.
 */
export const Demo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: color.abyss }}>
    <Sequence
      name="Chapter card"
      durationInFrames={INTRO + 10}
      premountFor={30}
    >
      <DemoIntro />
    </Sequence>
    <Sequence name="Recorded run" from={INTRO} premountFor={30}>
      <DemoMain />
    </Sequence>
  </AbsoluteFill>
);
