// Design tokens for the video. Colours are the brand's own (docs/VISUAL.md): the "abyss" bands
// of apps/web as the ground, Reservoir teal as the one action colour, and the two streams,
// Anchor (the sponsor's match) and Terra (the saver's savings), which only ever mean those two
// things and always sit next to a label. Hex values are converted from the OKLCH tokens in
// apps/web/src/app/globals.css so the WebGL map can use them too.
import { loadFont as loadFunnelDisplay } from '@remotion/google-fonts/FunnelDisplay';
import { loadFont as loadFunnelSans } from '@remotion/google-fonts/FunnelSans';
import { loadFont as loadGeistMono } from '@remotion/google-fonts/GeistMono';
import { Easing } from 'remotion';

export const color = {
  /** --abyss: the ground of every frame. */
  abyss: '#051522',
  abyssDeep: '#01060e',
  abyssRaised: '#10212f',
  rule: '#1f303e',
  /** --abyss-foreground */
  text: '#f1f6f8',
  /** --abyss-muted */
  muted: '#9fadb5',
  /** --abyss-primary ("Reservoir") */
  reservoir: '#15bbbd',
  /** --abyss-sponsor ("Anchor"): the sponsor's match. */
  sponsor: '#7ba0d6',
  /** --abyss-saver ("Terra"): the saver's own savings. */
  saver: '#f18d57',
  /** --ok (dark): vested and confirmed. */
  ok: '#4cb86a',
  warning: '#e48e26',
  land: '#1b2c3a',
  landEdge: '#2e4252',
} as const;

const display = loadFunnelDisplay('normal', {
  weights: ['500', '600'],
  subsets: ['latin'],
});
const sans = loadFunnelSans('normal', {
  weights: ['400', '500', '600'],
  subsets: ['latin'],
});
const mono = loadGeistMono('normal', {
  weights: ['400', '500'],
  subsets: ['latin'],
});

export const font = {
  /** Funnel Display: statements, used large and tight. */
  display: display.fontFamily,
  /** Funnel Sans: captions and supporting lines. */
  sans: sans.fontFamily,
  /** Geist Mono: figures, signatures, instruction names. The dApp's own mono. */
  mono: mono.fontFamily,
} as const;

/** The dApp's one strong ease-out (`--dapp-ease-out`), used for every entrance. */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
/** For moves that start and stop on screen: the cursor, the camera. */
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
/** Side margin that keeps text inside the safe area. */
export const MARGIN = 96;
