import { cache } from 'react';

import type { Transition } from 'motion/react';

const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const blurTransition = (delay = 0): Transition => ({
  delay,
  duration: 0.78,
  ease: premiumEase,
});

const blurVariantVertical = (delay = 0, y = 5) => ({
  initial: { y, x: 0, opacity: 0, filter: 'blur(12px)' },
  animate: { y: 0, x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: { y, x: 0, opacity: 0, filter: 'blur(12px)' },
  transition: blurTransition(delay),
});

const blurVariantHorizontal = (delay = 0, x = 5) => ({
  initial: { y: 0, x, opacity: 0, filter: 'blur(12px)' },
  animate: { y: 0, x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: { y: 0, x, opacity: 0, filter: 'blur(12px)' },
  transition: blurTransition(delay),
});

export const blurVariant = cache(
  ({
    y = 5,
    x = 0,
    delay,
    direction = 'vertical',
  }: {
    y?: number;
    x?: number;
    delay?: number;
    direction?: 'horizontal' | 'vertical';
  }) => {
    if (direction === 'vertical') {
      return blurVariantVertical(delay, y);
    }
    return blurVariantHorizontal(delay, x);
  },
);

export const blurInViewVariant = cache(
  ({
    y = 5,
    x = 0,
    delay,
    once = true,
  }: {
    y?: number;
    x?: number;
    once?: boolean;
    delay?: number;
  }) => ({
    initial: {
      y: y,
      x: x,
      opacity: 0,
      filter: 'blur(5px)',
    },
    whileInView: {
      y: 0,
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: {
      y: y,
      x: x,
      opacity: 0,
      filter: 'blur(5px)',
    },
    transition: {
      delay: delay ?? 0,
    },
    viewport: {
      once: once ?? true,
    },
  }),
);

export const simpleBlurVariant = cache((delay?: number) => ({
  initial: {
    opacity: 0,
    filter: 'blur(5px)',
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    filter: 'blur(5px)',
  },
  transition: {
    delay: delay ?? 0,
  },
}));
