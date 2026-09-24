import {
  Globe,
  type GlobeArc,
  type GlobeMarker,
  type GlobeRgb,
} from '@aquastock/ui/tw/globe';

import {
  HOME_FOCUS,
  ROUTES,
  focusAngles,
  type LatLng,
} from '@/modules/app/lib/globe';
import { cn } from '@/utils/classNames';

// sRGB 0..1 of --abyss-sponsor, --abyss-saver and --abyss-primary (globals.css), so the legend
// beside the globe keys it exactly.
const SPONSOR: GlobeRgb = [0.484, 0.628, 0.841];
const SAVER: GlobeRgb = [0.946, 0.554, 0.341];
const MATCH: GlobeRgb = [0.083, 0.735, 0.741];

const marker = ([lat, lng]: LatLng, color: GlobeRgb): GlobeMarker => ({
  location: [lat, lng],
  size: 0.04,
  color,
});

const MARKERS: GlobeMarker[] = ROUTES.flatMap((route) => [
  marker(route.from, SPONSOR),
  marker(route.to, SAVER),
]);

const ARCS: GlobeArc[] = ROUTES.map((route) => ({
  from: [route.from[0], route.from[1]],
  to: [route.to[0], route.to[1]],
}));

const FOCUS = focusAngles(HOME_FOCUS);

/**
 * The "anywhere with a wallet" globe: illustrative sponsor → saver routes (the band labels them as
 * such) on a slowly turning Earth, starting over Latin America.
 */
export function WorldGlobe({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* A glow that's there before (and without) WebGL, so the band never looks empty. */}
      <div
        aria-hidden
        className="absolute inset-1/8 rounded-full bg-abyss-primary/15 blur-3xl"
      />
      <Globe
        className="relative"
        markers={MARKERS}
        arcs={ARCS}
        phi={FOCUS.phi}
        // A little tilt towards the north, so the southern routes sit at the centre.
        theta={FOCUS.theta + 0.18}
        // One full turn every 80 seconds: alive, never busy.
        speed={(Math.PI * 2) / 80_000}
        look={{
          dark: 1,
          diffuse: 1.1,
          mapBrightness: 5,
          baseColor: [0.2, 0.3, 0.36],
          glowColor: [0.06, 0.2, 0.26],
          markerColor: SAVER,
          arcColor: MATCH,
          arcWidth: 0.6,
          arcHeight: 0.28,
          markerElevation: 0.01,
          opacity: 0.9,
        }}
      />
    </div>
  );
}
