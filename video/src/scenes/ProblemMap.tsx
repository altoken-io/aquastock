import * as turf from '@turf/turf';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from 'remotion';

import { Statement } from '../components/Statement';
import { color, font, MARGIN } from '../theme';

// The problem, on a globe: where an employer match exists today, and what Match Pools opens up.
// Geography is Natural Earth 1:110m (public domain), bundled in public/geo so the render needs no
// tile server. The routes are the web home's illustrative ones (apps/web/src/modules/app/lib/
// globe.ts): none is a real pool, and the frame says so.

export const PROBLEM_MAP_DURATION = 780;

type LngLat = [number, number];

interface Place {
  name: string;
  at: LngLat;
  /** Where the label sits against its dot. */
  side?: 'right' | 'left' | 'above';
}

interface Route {
  from: Place;
  to: Place;
}

const ROUTES: Route[] = [
  {
    from: { name: 'Madrid', at: [-3.7, 40.42] },
    to: { name: 'Lima', at: [-77.04, -12.05] },
  },
  {
    from: { name: 'Mexico City', at: [-99.13, 19.43], side: 'above' },
    to: { name: 'Bogotá', at: [-74.07, 4.71] },
  },
  {
    from: { name: 'São Paulo', at: [-46.63, -23.55] },
    to: { name: 'Buenos Aires', at: [-58.38, -34.6], side: 'left' },
  },
  {
    from: { name: 'London', at: [-0.13, 51.51], side: 'above' },
    to: { name: 'Lagos', at: [3.38, 6.52] },
  },
];

const ROUTES_FROM = 470;
const ROUTE_STAGGER = 34;
const ROUTE_DRAW = 56;

/** A great-circle route as one line; one crossing the antimeridian keeps its longest part. */
function greatCircleLine(from: LngLat, to: LngLat) {
  const route = turf.greatCircle(from, to, { npoints: 96 });
  if (route.geometry.type === 'LineString') {
    return turf.lineString(route.geometry.coordinates);
  }
  const longest = route.geometry.coordinates.reduce((best, segment) =>
    segment.length > best.length ? segment : best,
  );
  return turf.lineString(longest);
}

const lines = ROUTES.map((route) =>
  greatCircleLine(route.from.at, route.to.at),
);
const lengths = lines.map((line) => turf.length(line));

const routeProgress = (frame: number, index: number) =>
  interpolate(
    frame,
    [
      ROUTES_FROM + index * ROUTE_STAGGER,
      ROUTES_FROM + index * ROUTE_STAGGER + ROUTE_DRAW,
    ],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    },
  );

function routeData(frame: number) {
  return turf.featureCollection(
    lines.flatMap((line, index) => {
      const progress = routeProgress(frame, index);
      if (progress === 0) return [];
      // Turf refuses an empty slice, so the drawn part is never shorter than a metre.
      return [
        turf.lineSliceAlong(
          line,
          0,
          Math.max(0.001, (lengths[index] ?? 0) * progress),
        ),
      ];
    }),
  );
}

function endpointData(frame: number) {
  return turf.featureCollection(
    ROUTES.flatMap((route, index) => {
      const progress = routeProgress(frame, index);
      const start = ROUTES_FROM + index * ROUTE_STAGGER;
      const sponsor = interpolate(frame, [start - 8, start + 4], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      const saver = interpolate(progress, [0.85, 1], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      return [
        turf.point(route.from.at, { stream: 'sponsor', o: sponsor }),
        turf.point(route.to.at, { stream: 'saver', o: saver }),
      ];
    }),
  );
}

/** Camera path: the US first, then the Atlantic world the routes cross. */
function cameraAt(frame: number) {
  const ease = {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  } as const;
  const keys = [0, 210, 390, PROBLEM_MAP_DURATION];
  const lng = interpolate(frame, keys, [-101, -97, -42, -35], ease);
  const lat = interpolate(frame, keys, [39, 38, 14, 12], ease);
  return {
    center: [lng, lat] satisfies LngLat,
    zoom: interpolate(frame, keys, [2.3, 2.32, 2.2, 2.18], ease),
  };
}

const usHighlight = (frame: number) =>
  interpolate(frame, [18, 40, 230, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

interface Label {
  key: string;
  text: string;
  side: NonNullable<Place['side']>;
  stream: 'sponsor' | 'saver';
  x: number;
  y: number;
  opacity: number;
}

/** Pixels of the map kept clear on the left for the text column. */
const TEXT_SIDE = 760;

const WorldGlobe: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const { delayRender, continueRender } = useDelayRender();
  const [loading] = useState(() => delayRender('Loading the globe'));
  const [map, setMap] = useState<Map | null>(null);
  const [labels, setLabels] = useState<{ frame: number; items: Label[] }>({
    frame: -1,
    items: [],
  });
  const pending = useRef<{ frame: number; handle: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    maplibregl.setWorkerUrl(
      URL.createObjectURL(
        new Blob(
          [
            `import "https://unpkg.com/maplibre-gl@${maplibregl.getVersion()}/dist/maplibre-gl-worker.mjs";`,
          ],
          { type: 'text/javascript' },
        ),
      ),
    );
    const camera = cameraAt(0);
    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        projection: { type: 'globe' },
        sources: {
          countries: {
            type: 'geojson',
            data: new URL(
              staticFile('geo/countries-110m.geojson'),
              window.location.href,
            ).href,
          },
          routes: { type: 'geojson', data: routeData(0) },
          endpoints: { type: 'geojson', data: endpointData(0) },
        },
        layers: [
          {
            id: 'ocean',
            type: 'background',
            paint: { 'background-color': color.abyssRaised },
          },
          {
            id: 'land',
            type: 'fill',
            source: 'countries',
            paint: { 'fill-color': color.land },
          },
          {
            id: 'us',
            type: 'fill',
            source: 'countries',
            filter: ['==', ['get', 'iso'], 'USA'],
            paint: { 'fill-color': color.reservoir, 'fill-opacity': 0 },
          },
          {
            id: 'borders',
            type: 'line',
            source: 'countries',
            paint: { 'line-color': color.landEdge, 'line-width': 1 },
          },
          {
            id: 'routes',
            type: 'line',
            source: 'routes',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': color.sponsor, 'line-width': 4 },
          },
          {
            id: 'endpoints',
            type: 'circle',
            source: 'endpoints',
            paint: {
              'circle-radius': 9,
              'circle-color': [
                'match',
                ['get', 'stream'],
                'sponsor',
                color.sponsor,
                color.saver,
              ],
              'circle-opacity': ['get', 'o'],
              'circle-stroke-color': color.abyss,
              'circle-stroke-width': 3,
              'circle-stroke-opacity': ['get', 'o'],
            },
          },
        ],
      },
      center: camera.center,
      zoom: camera.zoom,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    instance.on('load', () => {
      instance.jumpTo({
        ...camera,
        padding: { left: TEXT_SIDE, top: 0, right: 0, bottom: 0 },
      });
      instance.once('idle', () => {
        setMap(instance);
        continueRender(loading);
      });
    });
  }, [continueRender, loading]);

  useEffect(() => {
    if (!map) return;
    const handle = delayRender(`Globe frame ${frame}`);
    const routes = map.getSource<GeoJSONSource>('routes');
    const endpoints = map.getSource<GeoJSONSource>('endpoints');
    routes?.setData(routeData(frame));
    endpoints?.setData(endpointData(frame));
    const us = usHighlight(frame);
    map.setPaintProperty('us', 'fill-opacity', 0.55 * us);
    map.jumpTo({
      ...cameraAt(frame),
      padding: { left: TEXT_SIDE, top: 0, right: 0, bottom: 0 },
    });
    map.once('idle', () => {
      const items: Label[] = ROUTES.flatMap((route, index) => {
        const start = ROUTES_FROM + index * ROUTE_STAGGER;
        const progress = routeProgress(frame, index);
        const from = map.project(route.from.at);
        const to = map.project(route.to.at);
        return [
          {
            key: `${route.from.name}-from`,
            text: route.from.name,
            side: route.from.side ?? 'right',
            stream: 'sponsor' as const,
            x: from.x,
            y: from.y,
            opacity: interpolate(frame, [start, start + 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          },
          {
            key: `${route.to.name}-to`,
            text: route.to.name,
            side: route.to.side ?? 'right',
            stream: 'saver' as const,
            x: to.x,
            y: to.y,
            opacity: interpolate(progress, [0.9, 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          },
        ];
      });
      pending.current = { frame, handle };
      setLabels({ frame, items });
    });
    // Idle fires even when nothing moved since the last frame.
    map.triggerRepaint();
  }, [continueRender, delayRender, frame, map]);

  // Release the frame only once its labels are on screen.
  useEffect(() => {
    const waiting = pending.current;
    if (waiting && waiting.frame === labels.frame) {
      pending.current = null;
      continueRender(waiting.handle);
    }
  }, [continueRender, labels]);

  return (
    <AbsoluteFill>
      <div ref={containerRef} style={{ position: 'absolute', width, height }} />
      {labels.items.map((label) =>
        label.opacity > 0 ? (
          <div
            key={label.key}
            style={{
              position: 'absolute',
              left: label.x,
              top: label.y,
              translate:
                label.side === 'right'
                  ? '18px -50%'
                  : label.side === 'left'
                    ? 'calc(-100% - 18px) -50%'
                    : '-50% calc(-100% - 16px)',
              whiteSpace: 'nowrap',
              fontFamily: font.mono,
              fontSize: 20,
              color: label.stream === 'sponsor' ? color.sponsor : color.saver,
              opacity: label.opacity,
              textShadow: `0 0 8px ${color.abyss}, 0 0 3px ${color.abyss}`,
            }}
          >
            {label.text}
          </div>
        ) : null,
      )}
      {usHighlight(frame) > 0 ? (
        <div
          style={{
            position: 'absolute',
            right: MARGIN,
            bottom: 72,
            fontFamily: font.mono,
            fontSize: 18,
            letterSpacing: '0.04em',
            color: color.muted,
            opacity: usHighlight(frame),
          }}
        >
          Source: US Treasury, Trump Accounts, 2026
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const ProblemMap: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: color.abyssDeep }}>
    <WorldGlobe />
    {/* A scrim keeps the text column readable over the globe's edge. */}
    <AbsoluteFill
      style={{
        background: `linear-gradient(90deg, ${color.abyssDeep} 0%, ${color.abyssDeep} 30%, transparent 50%)`,
      }}
    />
    <AbsoluteFill style={{ left: MARGIN, top: 300 }}>
      <Statement
        from={10}
        to={236}
        tag={{ stream: 'neutral', text: 'The problem' }}
        title="In the US, an employer can now add $2,500 a year"
        body="New Trump Accounts, live since July 2026, take up to $2,500 a year of employer money."
        width={720}
      />
      <Statement
        from={240}
        to={452}
        tag={{ stream: 'neutral', text: 'The problem' }}
        title="Without an employer, there is no match"
        body="Contractors, gig workers and savers outside the US get nothing like it."
        width={720}
      />
      <Statement
        from={456}
        tag={{ stream: 'both', text: 'The idea' }}
        title="Match Pools lets anyone be the employer"
        body="A DAO paying its contributors, an NGO, a city or a relative abroad funds a match on Solana."
        note={
          <span style={{ display: 'flex', gap: 28 }}>
            <span style={{ color: color.sponsor }}>● Sponsor</span>
            <span style={{ color: color.saver }}>● Saver</span>
            <span>Illustrative routes, not real pools</span>
          </span>
        }
        width={720}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);
