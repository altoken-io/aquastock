'use client';

import { cn } from '@/utils/classNames';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useId, useState } from 'react';

interface AnimatedGridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: number;
  numSquares?: number;
  className?: string;
  maxOpacity?: number;
  duration?: number;
  repeatDelay?: number;
}

export function AnimatedGridPattern({
  width = 56,
  height = 56,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.3,
  duration = 3,
  repeatDelay = 0.5,
  ...props
}: AnimatedGridPatternProps) {
  const id = useId();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [squares, setSquares] = useState<
    { id: number; x: number; y: number; delay: number }[]
  >([]);

  const getRandomDelay = useCallback(
    () => Math.random() * repeatDelay,
    [repeatDelay],
  );

  // Keep helpers memoized to satisfy exhaustive-deps and avoid stale closures.
  const getPos = useCallback(
    (dims = dimensions): [number, number] => {
      if (!dims.width || !dims.height) return [0, 0];
      return [
        Math.floor((Math.random() * dims.width) / width),
        Math.floor((Math.random() * dims.height) / height),
      ];
    },
    [dimensions, height, width],
  );

  const generateSquares = useCallback(
    (count: number, dims = dimensions) =>
      Array.from({ length: count }, (_, i) => {
        const [posX, posY] = getPos(dims);
        return { id: i, x: posX, y: posY, delay: getRandomDelay() };
      }),
    [dimensions, getPos, getRandomDelay],
  );

  useEffect(() => {
    const handleResize = () => {
      const nextDimensions = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setDimensions(nextDimensions);
      setSquares(generateSquares(numSquares, nextDimensions));
    };

    const frame = requestAnimationFrame(handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, [generateSquares, numSquares]);
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full overflow-hidden',
        className,
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full fill-neutral-400/30 stroke-neutral-400/30 dark:fill-neutral-300/10 dark:stroke-neutral-500/10"
      >
        <defs>
          <pattern
            id={id}
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
            x={x}
            y={y}
          >
            <path
              d={`M.5 ${height}V.5H${width}`}
              fill="none"
              strokeDasharray={strokeDasharray}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(({ x, y, id: squareId, delay }) => (
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ opacity: maxOpacity }}
              transition={{
                duration,
                repeat: Infinity,
                delay,
                repeatType: 'reverse',
                repeatDelay,
              }}
              onAnimationComplete={() => {
                const [newX, newY] = getPos();
                setSquares((currentSquares) =>
                  currentSquares.map((s) =>
                    s.id === squareId
                      ? { ...s, x: newX, y: newY, delay: getRandomDelay() }
                      : s,
                  ),
                );
              }}
              key={`${x}-${y}-${squareId}`}
              width={width - 1}
              height={height - 1}
              x={x * width + 1}
              y={y * height + 1}
              fill="currentColor"
              strokeWidth="0"
            />
          ))}
        </svg>
      </svg>
      {/* Top gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-[200px] bg-linear-to-b from-background to-transparent pointer-events-none z-10" />
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-linear-to-t from-background to-transparent pointer-events-none z-10" />
    </div>
  );
}
