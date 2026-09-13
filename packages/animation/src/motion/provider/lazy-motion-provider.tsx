'use client';

import type { ComponentProps, ReactNode } from 'react';
import { LazyMotion } from 'motion/react';

import { domAnimation } from '../features/dom-animation';

type LazyMotionProviderProps = Omit<
  ComponentProps<typeof LazyMotion>,
  'features' | 'children'
> & {
  children: ReactNode;
};

export function LazyMotionProvider({
  children,
  strict = true,
  ...props
}: LazyMotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict={strict} {...props}>
      {children}
    </LazyMotion>
  );
}
