import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

import { Closing, CLOSING_DURATION } from './scenes/Closing';
import { Demo, DEMO_DURATION } from './scenes/Demo';
import { Mechanism, MECHANISM_DURATION } from './scenes/Mechanism';
import { Opening, OPENING_DURATION } from './scenes/Opening';
import { PROBLEM_MAP_DURATION, ProblemMap } from './scenes/ProblemMap';
import { Trust, TRUST_DURATION } from './scenes/Trust';

// The submission video, in the order docs/DEMO_SCRIPT.md section 2 asks for: the problem, the
// idea, the working product on devnet, the honest caveats, why Solana, and where to try it.

const FADE = 18;

const SCENES = [
  OPENING_DURATION,
  PROBLEM_MAP_DURATION,
  MECHANISM_DURATION,
  DEMO_DURATION,
  TRUST_DURATION,
  CLOSING_DURATION,
];

/** Scene lengths minus the overlap of each fade between them. */
export const AQUASTOCK_DEMO_DURATION =
  SCENES.reduce((sum, frames) => sum + frames, 0) - FADE * (SCENES.length - 1);

const transition = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: FADE })}
  />
);

export const AquaStockDemo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence
      name="Opening"
      durationInFrames={OPENING_DURATION}
    >
      <Opening />
    </TransitionSeries.Sequence>
    {transition}
    <TransitionSeries.Sequence
      name="The problem"
      durationInFrames={PROBLEM_MAP_DURATION}
      premountFor={60}
    >
      <ProblemMap />
    </TransitionSeries.Sequence>
    {transition}
    <TransitionSeries.Sequence
      name="How it works"
      durationInFrames={MECHANISM_DURATION}
    >
      <Mechanism />
    </TransitionSeries.Sequence>
    {transition}
    <TransitionSeries.Sequence
      name="Live demo"
      durationInFrames={DEMO_DURATION}
      premountFor={30}
    >
      <Demo />
    </TransitionSeries.Sequence>
    {transition}
    <TransitionSeries.Sequence name="Trust" durationInFrames={TRUST_DURATION}>
      <Trust />
    </TransitionSeries.Sequence>
    {transition}
    <TransitionSeries.Sequence
      name="Why Solana"
      durationInFrames={CLOSING_DURATION}
    >
      <Closing />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
