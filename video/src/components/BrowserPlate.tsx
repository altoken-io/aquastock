import { Img, staticFile } from 'remotion';

import { color, font } from '../theme';

/** The captured viewport, in CSS pixels. Screenshots are this size at 2x. */
export const VIEWPORT = { width: 1280, height: 800 };
export const CHROME_HEIGHT = 44;

export interface Camera {
  zoom: number;
  /** The point to keep centred, in viewport pixels. */
  x: number;
  y: number;
}

/**
 * Where the zoomed content sits: the focus point is centred where it can be, and the page
 * never slides past its own edges.
 */
export function cameraOffset(camera: Camera): { x: number; y: number } {
  const clamp = (value: number, min: number) =>
    Math.min(0, Math.max(min, value));
  return {
    x: clamp(
      VIEWPORT.width / 2 - camera.x * camera.zoom,
      VIEWPORT.width - VIEWPORT.width * camera.zoom,
    ),
    y: clamp(
      VIEWPORT.height / 2 - camera.y * camera.zoom,
      VIEWPORT.height - VIEWPORT.height * camera.zoom,
    ),
  };
}

/** Maps a viewport point to plate pixels (below the chrome), through the camera. */
export function toPlate(
  point: { x: number; y: number },
  camera: Camera,
  scale: number,
): { x: number; y: number } {
  const offset = cameraOffset(camera);
  return {
    x: (point.x * camera.zoom + offset.x) * scale,
    y: (point.y * camera.zoom + offset.y) * scale + CHROME_HEIGHT,
  };
}

export interface PlateLayer {
  file: string;
  opacity: number;
}

/**
 * A quiet browser window around real screenshots of the app: an address bar with the page the
 * shot was taken on, and the page itself under a camera.
 */
export const BrowserPlate: React.FC<{
  width: number;
  layers: PlateLayer[];
  camera: Camera;
  host: string;
  path: string;
  children?: React.ReactNode;
}> = ({ width, layers, camera, host, path, children }) => {
  const scale = width / VIEWPORT.width;
  const offset = cameraOffset(camera);
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: VIEWPORT.height * scale + CHROME_HEIGHT,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: color.abyssRaised,
        boxShadow: `0 0 0 1px ${color.rule}, 0 40px 120px -40px ${color.abyssDeep}`,
      }}
    >
      <div
        style={{
          height: CHROME_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 18px',
          fontFamily: font.mono,
          fontSize: 17,
          color: color.muted,
        }}
      >
        <svg width={14} height={16} viewBox="0 0 14 16" aria-hidden>
          <rect x={1} y={7} width={12} height={8} rx={2} fill={color.muted} />
          <path
            d="M3.5 7V5a3.5 3.5 0 0 1 7 0v2"
            fill="none"
            stroke={color.muted}
            strokeWidth={1.6}
          />
        </svg>
        <span>
          <span style={{ color: color.text }}>{host}</span>
          {path}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          width: VIEWPORT.width * scale,
          height: VIEWPORT.height * scale,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: VIEWPORT.width,
            height: VIEWPORT.height,
            transformOrigin: '0 0',
            transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px) scale(${camera.zoom})`,
          }}
        >
          {layers.map((layer) => (
            <Img
              key={layer.file}
              src={staticFile(layer.file)}
              style={{
                position: 'absolute',
                inset: 0,
                width: VIEWPORT.width,
                height: VIEWPORT.height,
                opacity: layer.opacity,
              }}
            />
          ))}
        </div>
      </div>
      {children}
    </div>
  );
};
