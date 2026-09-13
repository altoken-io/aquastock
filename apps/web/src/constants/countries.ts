export type CountryPin = {
  code: string;
  name: string;
  lat: number;
  lng: number;
  /** Small presentational nudge (viewBox units) applied only to the flag
   * marker, not the arc endpoint — the Andean capitals sit close enough
   * geographically that their true positions overlap at map scale. */
  markerOffset?: { dx: number; dy: number };
};

// Peru is AquaStock's home market (see docs/ABOUT.md) and the United States is
// the only live cross-border corridor today. Colombia, Ecuador, and Bolivia
// are NOT live — they're shown here as a deliberate product decision
// (Oliver, 2026-09-12) to visually represent near-term expansion targets
// identical to the live pins, even though this contradicts the "US and Peru
// only" scope stated in the 2026-09-11 Transak KYB correction and implied by
// docs/TERMS_OF_SERVICE.md. If this map is ever referenced in a partner or
// regulatory context, flag that mismatch rather than assuming it's settled.
// Coordinates are each country's capital or primary financial center,
// projected onto the WorldMap's dotted background via projectWorldMapPoint.
export const countries: CountryPin[] = [
  {
    code: 'pe',
    name: 'Perú',
    lat: -12.0464,
    lng: -77.0428,
    markerOffset: { dx: -8, dy: -12 },
  },
  {
    code: 'us',
    name: 'Estados Unidos',
    lat: 25.7617,
    lng: -80.1918,
    markerOffset: { dx: 10, dy: 0 },
  },
  {
    code: 'co',
    name: 'Colombia',
    lat: 4.711,
    lng: -74.0721,
    markerOffset: { dx: 16, dy: -20 },
  },
  {
    code: 'ec',
    name: 'Ecuador',
    lat: -0.1807,
    lng: -78.4678,
    markerOffset: { dx: -22, dy: -8 },
  },
  {
    code: 'bo',
    name: 'Bolivia',
    lat: -16.5,
    lng: -68.15,
    markerOffset: { dx: 32, dy: 20 },
  },
];
