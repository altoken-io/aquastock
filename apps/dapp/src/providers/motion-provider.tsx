'use client';
import { LazyMotion, domAnimation } from 'motion/react';

export const MotionProvider = ({ children }: { children: React.ReactNode }) => (
  <LazyMotion features={domAnimation}>{children}</LazyMotion>
);
