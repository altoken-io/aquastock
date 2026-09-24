import { Composition, Folder } from 'remotion';

import { AQUASTOCK_DEMO_DURATION, AquaStockDemo } from './AquaStockDemo';
import { Closing, CLOSING_DURATION } from './scenes/Closing';
import { Demo, DEMO_DURATION } from './scenes/Demo';
import { Mechanism, MECHANISM_DURATION } from './scenes/Mechanism';
import { Opening, OPENING_DURATION } from './scenes/Opening';
import { PROBLEM_MAP_DURATION, ProblemMap } from './scenes/ProblemMap';
import { Trust, TRUST_DURATION } from './scenes/Trust';
import { FPS, HEIGHT, WIDTH } from './theme';

const SCENES = [
  { id: 'Opening', component: Opening, frames: OPENING_DURATION },
  { id: 'ProblemMap', component: ProblemMap, frames: PROBLEM_MAP_DURATION },
  { id: 'Mechanism', component: Mechanism, frames: MECHANISM_DURATION },
  { id: 'Demo', component: Demo, frames: DEMO_DURATION },
  { id: 'Trust', component: Trust, frames: TRUST_DURATION },
  { id: 'Closing', component: Closing, frames: CLOSING_DURATION },
];

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AquaStockDemo"
      component={AquaStockDemo}
      width={WIDTH}
      height={HEIGHT}
      fps={FPS}
      durationInFrames={AQUASTOCK_DEMO_DURATION}
    />
    {/* Each scene on its own timeline, the same components the video uses. */}
    <Folder name="Scenes">
      {SCENES.map((scene) => (
        <Composition
          key={scene.id}
          id={scene.id}
          component={scene.component}
          width={WIDTH}
          height={HEIGHT}
          fps={FPS}
          durationInFrames={scene.frames}
        />
      ))}
    </Folder>
  </>
);
