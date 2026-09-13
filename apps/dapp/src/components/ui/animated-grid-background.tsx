'use client';

import { useId } from 'react';

import { cn } from '@/utils/classNames';

interface AnimatedGridBackgroundProps {
  width?: number; // Cell width
  height?: number; // Cell height
  className?: string;
}

export const AnimatedGridBackground = ({
  width = 40,
  height = 40,
  className,
}: AnimatedGridBackgroundProps) => {
  const id = useId();

  // 16x5 grid dimensions
  // 16 * 40 = 640
  // 5 * 40 = 200
  const TOTAL_WIDTH = width * 16;
  const TOTAL_HEIGHT = height * 5;

  // Define two distinct continuous paths that cover the grid
  // Path 1: Meanders through the left/center
  const d1 = `
        M ${width * 1} ${height * 2}
        H ${width * 2}
        V ${height * 3}
        H ${width * 3}
        V ${height * 4}
        H ${width * 4}
        V ${height * 3}
        H ${width * 5}
        V ${height * 4}
        H ${width * 6}
        V ${height * 5}
        H ${width * 7}
        V ${height * 4}
        H ${width * 8}
        V ${height * 3}
        H ${width * 9}
        V ${height * 3}
        H ${width * 10}
        V ${height * 5}
        H ${width * 11}
        V ${height * 3}
        H ${width * 12}
        V ${height * 5}
        H ${width * 11}
        V ${height * 4}
        H ${width * 9}
        V ${height * 3}
        H ${width * 7}
        V ${height * 5}
        H ${width * 5}
        V ${height * 4}
        H ${width * 3}
        V ${height * 3}
        H ${width * 1}
        Z
    `;

  // Path 2 — rectangular no convexo, cíclico (step size = 1 celda)
  const d2 = `
        M ${width * 14} ${height * 2}
        V ${height * 3}
        H ${width * 13}
        V ${height * 4}
        H ${width * 12}
        V ${height * 3}
        H ${width * 11}
        V ${height * 4}
        H ${width * 10}
        V ${height * 5}
        H ${width * 9}
        V ${height * 4}
        H ${width * 8}
        V ${height * 3}
        H ${width * 7}
        V ${height * 3}
        H ${width * 6}
        V ${height * 5}
        H ${width * 5}
        V ${height * 4}
        H ${width * 6}
        V ${height * 3}
        H ${width * 8}
        V ${height * 4}
        H ${width * 10}
        V ${height * 5}
        H ${width * 12}
        V ${height * 4}
        H ${width * 13}
        V ${height * 3}
        H ${width * 14}
        Z
    `;

  // We want the beam to be exactly one "edge" long.
  // Total length of these paths varies, but we can approximate or calculate.
  // A simpler trick for "size of one edge" with CSS is difficult if total length is unknown.
  // However, for a visual effect, a fixed relatively short dasharray works well.
  // Given the paths are rectilinear, total lengths are multiples of 'width'/'height'.
  // We'll set a stroke-dasharray where the dash part is approx 'width'.

  return (
    <svg
      viewBox={`0 0 ${TOTAL_WIDTH} ${TOTAL_HEIGHT}`}
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full',
        // Vignette: Transparent edges
        '[mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_90%)]',
        className,
      )}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={0}
          y={0}
        >
          <path
            d={`M${width} 0 V${height} M0 ${height} H${width}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity="1" // Very subtle base grid
          />
        </pattern>
        <linearGradient
          id={`${id}-gradient`}
          x1="100%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Base Grid */}
      <rect width="100%" height="100%" fill={`url(#${id})`} />

      {/* Animated Beams */}
      {/* 
                CSS Animation Logic:
                stroke-dasharray: 10 220
                animation: travel 20s linear infinite
            */}
      <path
        d={d1}
        stroke={`url(#${id}-gradient)`}
        strokeWidth="2"
        strokeLinecap="square"
        // Approx length of d1 is ~30-40 * width.
        // We want beam = width (40). Gap = big enough.
        strokeDasharray={`${width} 2000`}
        className="animate-beam-infinite"
      />
      <path
        d={d2}
        stroke={`url(#${id}-gradient)`}
        strokeWidth="2"
        strokeLinecap="square"
        strokeDasharray={`${width} 2000`}
        className="animate-beam-infinite"
        style={{ animationDelay: '-2s', animationDuration: '20s' }}
      />
    </svg>
  );
};

export default AnimatedGridBackground;
