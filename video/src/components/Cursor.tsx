import { color } from '../theme';

/**
 * A plain arrow pointer. `press` (0..1) dips it on a click; `ripple` (0..1) draws the ring that
 * marks where the click landed, in the brand's action colour.
 */
export const Cursor: React.FC<{
  x: number;
  y: number;
  press: number;
  ripple: number | null;
  opacity: number;
}> = ({ x, y, press, ripple, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      translate: `${x}px ${y}px`,
      opacity,
      pointerEvents: 'none',
    }}
  >
    {ripple !== null ? (
      <div
        style={{
          position: 'absolute',
          left: -40 * ripple,
          top: -40 * ripple,
          width: 80 * ripple,
          height: 80 * ripple,
          borderRadius: '50%',
          border: `3px solid ${color.reservoir}`,
          opacity: 1 - ripple,
        }}
      />
    ) : null}
    <svg
      width={30}
      height={30}
      viewBox="0 0 24 24"
      style={{
        position: 'absolute',
        left: -3,
        top: -2,
        scale: `${1 - press * 0.16}`,
        transformOrigin: '3px 2px',
        filter: 'drop-shadow(0 3px 6px rgba(1, 6, 14, 0.45))',
      }}
      aria-hidden
    >
      <path
        d="M4 2.5 L4 19.5 L8.6 15.3 L11.6 21.8 L14.6 20.4 L11.6 14.1 L17.8 14.1 Z"
        fill="#ffffff"
        stroke="#0b1520"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  </div>
);
