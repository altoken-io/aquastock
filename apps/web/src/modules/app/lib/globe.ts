/**
 * Geography for the home page's globe (world-globe.tsx). Kept free of imports so it runs under
 * plain `node --test`.
 */
export type LatLng = readonly [lat: number, lng: number];

export type Route = {
  /** The sponsor's end of the arc. */
  from: LatLng;
  /** The saver's end of the arc. */
  to: LatLng;
};

/**
 * Illustrative sponsor → saver routes, labelled as such on the page: none of them is a real pool.
 * Latin America first (the likely audience, and the hackathon spec's), and none starts or ends in
 * the US, where tokenized stocks like SPYx aren't offered.
 */
export const ROUTES: readonly Route[] = [
  // Madrid → Lima
  { from: [40.42, -3.7], to: [-12.05, -77.04] },
  // Mexico City → Bogotá
  { from: [19.43, -99.13], to: [4.71, -74.07] },
  // São Paulo → Buenos Aires
  { from: [-23.55, -46.63], to: [-34.6, -58.38] },
  // London → Lagos
  { from: [51.51, -0.13], to: [6.52, 3.38] },
  // Singapore → Manila
  { from: [1.35, 103.82], to: [14.6, 120.98] },
];

/** Where the globe starts turned to: between the Latin American routes. */
export const HOME_FOCUS: LatLng = [0, -62];

const TAU = Math.PI * 2;

/** An angle in radians, wrapped into [0, 2π). */
export const wrapAngle = (angle: number): number => ((angle % TAU) + TAU) % TAU;

/**
 * The globe rotation (cobe's `phi`, around the vertical axis, and `theta`, the tilt) that puts a
 * point at the centre of the visible face.
 */
export function focusAngles([lat, lng]: LatLng): {
  phi: number;
  theta: number;
} {
  return {
    phi: wrapAngle(Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2)),
    theta: (lat * Math.PI) / 180,
  };
}
