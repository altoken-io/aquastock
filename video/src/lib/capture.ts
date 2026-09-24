// Reads the manifest `pnpm capture` wrote. It is validated once, at import, so a scene can
// never render a half-recorded run without saying so.
import raw from '../../public/capture/manifest.json';
import {
  isCaptureManifest,
  type Box,
  type CaptureManifest,
  type Shot,
} from './capture-manifest';

function load(data: unknown): CaptureManifest {
  if (!isCaptureManifest(data)) {
    throw new Error(
      'public/capture/manifest.json is missing or malformed. Run `pnpm capture`.',
    );
  }
  return data;
}

export const capture = load(raw);

const shots = new Map(capture.shots.map((shot) => [shot.id, shot]));

export function shot(id: string): Shot {
  const found = shots.get(id);
  if (!found) {
    throw new Error(`No shot "${id}" in the capture. Run \`pnpm capture\`.`);
  }
  return found;
}

export function box(id: string, name: string): Box {
  const found = shot(id).boxes[name];
  if (!found) throw new Error(`Shot "${id}" has no box "${name}"`);
  return found;
}

export const center = (b: Box) => ({
  x: b.x + b.width / 2,
  y: b.y + b.height / 2,
});

/** `4xT9…Qa2k`: enough of a signature or address to find it, short enough to read. */
export const short = (value: string, head = 4, tail = 4) =>
  `${value.slice(0, head)}…${value.slice(-tail)}`;

/** Whole seconds between two shots, as the chain's clock saw them. */
export const secondsBetween = (from: string, to: string) =>
  Math.round(
    (new Date(shot(to).takenAt).getTime() -
      new Date(shot(from).takenAt).getTime()) /
      1000,
  );

export const appHost = new URL(capture.app).host;
