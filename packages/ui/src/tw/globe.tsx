'use client';

import { useEffect, useRef } from 'react';
import type { Arc, COBEOptions, Globe as CobeGlobe, Marker } from 'cobe';

import { cn } from '../utils/classNames';

export type GlobeRgb = [number, number, number];
export type { Arc as GlobeArc, Marker as GlobeMarker };

export type GlobeProps = {
  markers?: Marker[];
  arcs?: Arc[];
  /** Starting rotation around the vertical axis, in radians (cobe's `phi`). */
  phi?: number;
  /** Tilt, in radians (cobe's `theta`). */
  theta?: number;
  /** Radians per millisecond of automatic rotation; 0 holds still. Ignored under reduced motion. */
  speed?: number;
  /** Colours and shading, passed through to cobe (sRGB 0..1). */
  look?: Partial<
    Pick<
      COBEOptions,
      | 'dark'
      | 'diffuse'
      | 'mapSamples'
      | 'mapBrightness'
      | 'baseColor'
      | 'glowColor'
      | 'markerColor'
      | 'arcColor'
      | 'arcWidth'
      | 'arcHeight'
      | 'markerElevation'
      | 'opacity'
    >
  >;
  className?: string;
  canvasClassName?: string;
};

const RADIANS_PER_DRAG_PX = 0.006;
// cobe loads its map texture asynchronously, so a globe that isn't turning keeps drawing for a
// moment after creation; one frame would show the markers on a blank sphere.
const SETTLE_MS = 2000;

const DEFAULT_LOOK = {
  dark: 1,
  diffuse: 1.2,
  mapSamples: 16_000,
  mapBrightness: 6,
  baseColor: [0.3, 0.3, 0.3],
  glowColor: [1, 1, 1],
  markerColor: [1, 1, 1],
} satisfies GlobeProps['look'];

/**
 * A WebGL dotted globe (cobe) that turns slowly and can be dragged sideways.
 *
 * Built to be cheap on a marketing page: cobe (~13 KB) is imported only when the globe comes near
 * the viewport, the render loop stops whenever it's off screen, and under reduced motion it never
 * turns on its own (it still follows a drag). Without WebGL the canvas simply never fades in.
 * It's decorative (`aria-hidden`), so whatever it illustrates must also be said in text beside it.
 * The props are read once, when the globe is created.
 */
export function Globe({
  markers = [],
  arcs = [],
  phi: startPhi = 0,
  theta = 0.3,
  speed = (Math.PI * 2) / 60_000,
  look,
  className,
  canvasClassName,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read on creation only; a changing prop shouldn't tear down a WebGL context.
  const initial = useRef({ markers, arcs, startPhi, theta, speed, look });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { markers, arcs, startPhi, theta, speed, look } = initial.current;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let globe: CobeGlobe | null = null;
    let loading = false;
    let disposed = false;
    let inView = false;
    let frame = 0;
    let last = 0;
    let phi = startPhi;
    let dragFrom: number | null = null;
    let dragDelta = 0;
    let settleUntil = 0;

    const pixelSize = () => {
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const side = canvas.offsetWidth * devicePixelRatio;
      return { devicePixelRatio, width: side, height: side };
    };

    const render = (now: number) => {
      frame = 0;
      if (!globe) return;
      const elapsed = last ? now - last : 0;
      last = now;
      if (!reduceMotion && dragFrom === null) phi += elapsed * speed;
      globe.update({ phi: phi + dragDelta });
      const turning = !reduceMotion && speed !== 0;
      if (inView && (turning || now < settleUntil)) {
        frame = requestAnimationFrame(render);
      }
    };

    const schedule = () => {
      if (frame || !globe) return;
      last = 0;
      frame = requestAnimationFrame(render);
    };

    const load = async () => {
      loading = true;
      const { default: createGlobe } = await import('cobe');
      if (disposed) return;
      try {
        globe = createGlobe(canvas, {
          ...DEFAULT_LOOK,
          ...look,
          ...pixelSize(),
          phi,
          theta,
          markers,
          arcs,
        });
      } catch {
        // No WebGL: the canvas stays transparent.
        return;
      }
      canvas.dataset.ready = 'true';
      settleUntil = performance.now() + SETTLE_MS;
      schedule();
    };

    const visibility = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? false;
        if (!inView) return;
        if (!globe && !loading) void load();
        else schedule();
      },
      { rootMargin: '200px 0px' },
    );
    visibility.observe(canvas);

    const resize = new ResizeObserver(() => {
      if (!globe) return;
      const { width, height } = pixelSize();
      globe.update({ width, height });
      schedule();
    });
    resize.observe(canvas);

    const onPointerDown = (event: PointerEvent) => {
      dragFrom = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragFrom === null) return;
      dragDelta = (event.clientX - dragFrom) * RADIANS_PER_DRAG_PX;
      schedule();
    };
    const onPointerUp = () => {
      if (dragFrom === null) return;
      phi += dragDelta;
      dragDelta = 0;
      dragFrom = null;
      schedule();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      disposed = true;
      visibility.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      globe?.destroy();
    };
  }, []);

  return (
    <div aria-hidden className={cn('relative aspect-square', className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          'size-full cursor-grab touch-pan-y opacity-0 transition-opacity duration-1000 ease-out active:cursor-grabbing data-[ready=true]:opacity-100 motion-reduce:transition-none',
          canvasClassName,
        )}
      />
    </div>
  );
}
