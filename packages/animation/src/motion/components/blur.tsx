'use client';

import type { ComponentProps } from 'react';
import * as m from 'motion/react-m';
import { blurInViewVariant, blurVariant, simpleBlurVariant } from '../../utils';

type BlurDelayProps = {
  delay?: number;
  y?: number;
};

type BlurDivProps = ComponentProps<typeof m.div> & BlurDelayProps;
type BlurH1Props = ComponentProps<typeof m.h1> & BlurDelayProps;
type BlurPProps = ComponentProps<typeof m.p> & BlurDelayProps;
type BlurSectionProps = ComponentProps<typeof m.section> & BlurDelayProps;
type BlurSpanProps = ComponentProps<typeof m.span> & BlurDelayProps;

const blurWillChange = 'filter, opacity, transform';

// Merge motion-friendly style defaults without overriding caller styles.
function getBlurStyle(style?: ComponentProps<typeof m.div>['style']) {
  return style
    ? {
        willChange: blurWillChange,
        ...style,
      }
    : { willChange: blurWillChange };
}

// Blur-enabled motion div with shared default entrance animation.
export function BlurDiv({
  delay,
  y,
  style,
  initial,
  animate,
  exit,
  transition,
  ...props
}: BlurDivProps) {
  const defaults = blurVariant({ y: y ?? 16, delay });

  return (
    <m.div
      initial={initial ?? defaults.initial}
      animate={animate ?? defaults.animate}
      exit={exit ?? defaults.exit}
      transition={transition ?? defaults.transition}
      style={getBlurStyle(style)}
      {...props}
    />
  );
}

// Blur-enabled motion div with shared default in-view animation.
export function BlurInViewDiv({
  delay,
  y,
  style,
  initial,
  whileInView,
  exit,
  viewport,
  transition,
  ...props
}: BlurDivProps) {
  const defaults = blurInViewVariant({ y: y ?? 16, delay });

  return (
    <m.div
      initial={initial ?? defaults.initial}
      whileInView={whileInView ?? defaults.whileInView}
      exit={exit ?? defaults.exit}
      viewport={viewport ?? defaults.viewport}
      transition={transition ?? defaults.transition}
      style={getBlurStyle(style)}
      {...props}
    />
  );
}

// Blur-enabled motion heading with a slightly stronger default offset.
export function BlurH1({
  delay,
  y,
  style,
  initial,
  animate,
  transition,
  ...props
}: BlurH1Props) {
  const defaults = blurVariant({ y: y ?? 20, delay });

  return (
    <m.h1
      initial={initial ?? defaults.initial}
      animate={animate ?? defaults.animate}
      transition={transition ?? defaults.transition}
      style={getBlurStyle(style)}
      {...props}
    />
  );
}

// Blur-enabled motion paragraph with lighter default movement.
export function BlurP({
  delay,
  y,
  style,
  initial,
  animate,
  transition,
  ...props
}: BlurPProps) {
  const defaults = blurVariant({ y: y ?? 12, delay });

  return (
    <m.p
      initial={initial ?? defaults.initial}
      animate={animate ?? defaults.animate}
      transition={transition ?? defaults.transition}
      style={getBlurStyle(style)}
      {...props}
    />
  );
}

// Blur-enabled motion section for simple fade-and-sharpen reveals.
export function BlurSection({
  delay,
  style,
  initial,
  animate,
  transition,
  ...props
}: BlurSectionProps) {
  const defaults = simpleBlurVariant(delay);

  return (
    <m.section
      initial={initial ?? defaults.initial}
      animate={animate ?? defaults.animate}
      transition={transition ?? defaults.transition}
      style={getBlurStyle(style)}
      {...props}
    />
  );
}

// Blur-enabled motion span for small inline reveal animations.
export function BlurSpan({
  delay,
  style,
  initial,
  animate,
  transition,
  ...props
}: BlurSpanProps) {
  const defaults = simpleBlurVariant(delay);

  return (
    <m.span
      initial={initial ?? defaults.initial}
      animate={animate ?? defaults.animate}
      transition={transition ?? defaults.transition}
      style={getBlurStyle(style)}
      {...props}
    />
  );
}
