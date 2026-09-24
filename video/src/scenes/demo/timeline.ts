// The demo chapter as data: beats (what the left column says) made of steps (one real screenshot
// each, with where the camera looks and what the cursor presses). `buildTimeline` flattens it into
// absolute keyframes, so the scene only samples them per frame.
import type { RailEvent } from '../../components/ProofRail';
import type { Camera } from '../../components/BrowserPlate';
import { VIEWPORT } from '../../components/BrowserPlate';
import { box, center, shot } from '../../lib/capture';

export type Stream = 'sponsor' | 'saver' | 'both' | 'chain';

/** A named box in the step's shot, optionally nudged, or a point in viewport pixels. */
export type Focus =
  { box: string; dx?: number; dy?: number } | { x: number; y: number };

export interface CameraKey {
  at: number;
  zoom: number;
  focus?: Focus;
}

export interface StepSpec {
  shot: string;
  frames: number;
  /** Camera keyframes within the step. Without any, the camera eases back to the whole page. */
  camera?: CameraKey[];
  /** Presses on named boxes of this shot, at frames within the step. */
  clicks?: { at: number; target: string }[];
  /** Hide the pointer for this step (nothing is being pressed). */
  cursor?: boolean;
  /** A label pinned to the plate, such as the time since the deposit. */
  badge?: string;
  events?: { at: number; event: Omit<RailEvent, 'at'> }[];
}

export interface BeatSpec {
  stream: Stream;
  tag: string;
  title: string;
  body: string;
  steps: StepSpec[];
}

export interface TimedStep extends StepSpec {
  start: number;
  end: number;
  file: string;
  path: string;
}

export interface TimedBeat extends Omit<BeatSpec, 'steps'> {
  start: number;
  end: number;
}

interface Key {
  frame: number;
  values: number[];
}

export interface Timeline {
  duration: number;
  beats: TimedBeat[];
  steps: TimedStep[];
  camera: Key[];
  cursor: Key[];
  clicks: { frame: number }[];
  events: RailEvent[];
}

const PAGE_CENTER = { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 };
const CAMERA_EASE_FRAMES = 20;
const CURSOR_TRAVEL_FRAMES = 16;

function resolveFocus(shotId: string, focus: Focus | undefined) {
  if (!focus) return PAGE_CENTER;
  if ('box' in focus) {
    const point = center(box(shotId, focus.box));
    return { x: point.x + (focus.dx ?? 0), y: point.y + (focus.dy ?? 0) };
  }
  return focus;
}

export function buildTimeline(beats: BeatSpec[]): Timeline {
  const timedBeats: TimedBeat[] = [];
  const steps: TimedStep[] = [];
  const camera: Key[] = [
    { frame: 0, values: [1, PAGE_CENTER.x, PAGE_CENTER.y] },
  ];
  const cursor: Key[] = [{ frame: 0, values: [1040, 720] }];
  const clicks: { frame: number }[] = [];
  const events: RailEvent[] = [];
  let frame = 0;

  const lastValues = (keys: Key[]) => keys[keys.length - 1]?.values ?? [];
  const push = (keys: Key[], at: number, values: number[]) => {
    const last = keys[keys.length - 1];
    const safe = last && at <= last.frame ? last.frame + 1 : at;
    keys.push({ frame: safe, values });
  };

  for (const beat of beats) {
    const beatStart = frame;
    for (const step of beat.steps) {
      const found = shot(step.shot);
      const start = frame;
      const end = start + step.frames;

      // Hold the previous framing until this step begins, then move.
      push(camera, start, lastValues(camera));
      const keys = step.camera?.length
        ? step.camera
        : [{ at: CAMERA_EASE_FRAMES, zoom: 1 }];
      for (const key of keys) {
        const point =
          key.zoom === 1 && !key.focus
            ? PAGE_CENTER
            : resolveFocus(step.shot, key.focus);
        push(camera, start + key.at, [key.zoom, point.x, point.y]);
      }

      for (const click of step.clicks ?? []) {
        const at = start + click.at;
        const target = center(box(step.shot, click.target));
        push(cursor, at - CURSOR_TRAVEL_FRAMES, lastValues(cursor));
        push(cursor, at - 2, [target.x, target.y]);
        clicks.push({ frame: at });
      }

      for (const { at, event } of step.events ?? []) {
        events.push({ ...event, at: start + at });
      }

      steps.push({ ...step, start, end, file: found.file, path: found.path });
      frame = end;
    }
    timedBeats.push({
      stream: beat.stream,
      tag: beat.tag,
      title: beat.title,
      body: beat.body,
      start: beatStart,
      end: frame,
    });
  }

  return {
    duration: frame,
    beats: timedBeats,
    steps,
    camera,
    cursor,
    clicks,
    events,
  };
}

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** Samples keyframes at `frame`, easing in and out between each pair. */
export function sample(keys: Key[], frame: number): number[] {
  const first = keys[0];
  if (!first) return [];
  if (frame <= first.frame) return first.values;
  for (let index = 1; index < keys.length; index += 1) {
    const next = keys[index];
    const previous = keys[index - 1];
    if (!next || !previous) break;
    if (frame <= next.frame) {
      const t = easeInOut(
        (frame - previous.frame) / (next.frame - previous.frame),
      );
      return previous.values.map(
        (value, i) => value + ((next.values[i] ?? value) - value) * t,
      );
    }
  }
  return keys[keys.length - 1]?.values ?? first.values;
}

export function cameraAt(timeline: Timeline, frame: number): Camera {
  const [zoom = 1, x = PAGE_CENTER.x, y = PAGE_CENTER.y] = sample(
    timeline.camera,
    frame,
  );
  return { zoom, x, y };
}
