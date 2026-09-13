'use client';

import { useMemo } from 'react';

import { type HTMLMotionProps } from 'motion/react';
import * as motion from 'motion/react-m';

import { blurInViewVariant, blurVariant } from '@/lib/motion/utils';

export type BlurLazyMotionProps<T extends keyof HTMLElementTagNameMap> =
  HTMLMotionProps<T> &
    Readonly<{
      y?: number;
      x?: number;
      delay?: number;
      once?: boolean;
      direction?: 'horizontal' | 'vertical';
    }>;

export const MotionDiv = ({
  y,
  x,
  delay,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'div'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.div {...rest} {...props}>
      {children}
    </motion.div>
  );
};

export const MotionAside = ({
  y,
  x,
  delay,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'aside'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.aside {...rest} {...props}>
      {children}
    </motion.aside>
  );
};

export const MotionIframe = ({
  y,
  x,
  delay,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'iframe'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.iframe {...rest} {...props}>
      {children}
    </motion.iframe>
  );
};

export const MotionImg = ({
  y,
  x,
  delay,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'img'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.img {...rest} {...props}>
      {children}
    </motion.img>
  );
};

export const MotionLi = ({
  y,
  x,
  delay,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'li'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.li {...rest} {...props}>
      {children}
    </motion.li>
  );
};

export const MotionLink = ({
  y,
  x,
  delay,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'a'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.a {...rest} {...props}>
      {children}
    </motion.a>
  );
};

export const MotionInViewImg = ({
  delay,
  children,
  once,
  ...props
}: BlurLazyMotionProps<'img'>) => {
  const rest = useMemo(() => blurInViewVariant({ delay, once }), [delay, once]);
  return (
    <motion.img {...rest} {...props}>
      {children}
    </motion.img>
  );
};

export const MotionInViewLi = ({
  delay,
  children,
  once,
  ...props
}: BlurLazyMotionProps<'li'>) => {
  const rest = useMemo(() => blurInViewVariant({ delay, once }), [delay, once]);
  return (
    <motion.li {...rest} {...props}>
      {children}
    </motion.li>
  );
};

export const MotionInViewDiv = ({
  delay,
  children,
  once,
  ...props
}: BlurLazyMotionProps<'div'>) => {
  const rest = useMemo(() => blurInViewVariant({ delay, once }), [delay, once]);
  return (
    <motion.div {...rest} {...props}>
      {children}
    </motion.div>
  );
};

export const MotionInViewH1 = ({
  delay,
  children,
  once,
  ...props
}: BlurLazyMotionProps<'h1'>) => {
  const rest = useMemo(() => blurInViewVariant({ delay, once }), [delay, once]);
  return (
    <motion.h1 {...rest} {...props}>
      {children}
    </motion.h1>
  );
};

export const MotionInViewH2 = ({
  delay,
  children,
  once,
  ...props
}: BlurLazyMotionProps<'h2'>) => {
  const rest = useMemo(() => blurInViewVariant({ delay, once }), [delay, once]);
  return (
    <motion.h2 {...rest} {...props}>
      {children}
    </motion.h2>
  );
};

export const MotionInViewText = ({
  delay,
  children,
  once,
  ...props
}: BlurLazyMotionProps<'p'>) => {
  const rest = useMemo(() => blurInViewVariant({ delay, once }), [delay, once]);
  return (
    <motion.p {...rest} {...props}>
      {children}
    </motion.p>
  );
};

export const MotionInViewSpan = ({
  delay,
  children,
  once,
  ...props
}: BlurLazyMotionProps<'span'>) => {
  const rest = useMemo(() => blurInViewVariant({ delay, once }), [delay, once]);
  return (
    <motion.span {...rest} {...props}>
      {children}
    </motion.span>
  );
};

export const MotionButton = ({
  y,
  x,
  delay,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'button'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.button {...rest} {...props}>
      {children}
    </motion.button>
  );
};

export const MotionHeader = ({
  y,
  x,
  direction = 'vertical',
  delay,
  children,
  ...props
}: BlurLazyMotionProps<'header'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.header {...rest} {...props}>
      {children}
    </motion.header>
  );
};

export const MotionSection = ({
  delay,
  y,
  x,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'section'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.section {...rest} {...props}>
      {children}
    </motion.section>
  );
};

export const MotionMain = ({
  delay,
  y,
  x,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'main'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.main {...rest} {...props}>
      {children}
    </motion.main>
  );
};

export const MotionNav = ({
  delay,
  y,
  x,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'nav'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.nav {...rest} {...props}>
      {children}
    </motion.nav>
  );
};

export const MotionVideo = ({
  delay,
  y,
  x,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'video'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.video {...rest} {...props}>
      {children}
    </motion.video>
  );
};

export const MotionH1 = ({
  delay,
  y,
  x,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'h1'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.h1 {...rest} {...props}>
      {children}
    </motion.h1>
  );
};

export const MotionH2 = ({
  delay,
  y,
  x,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'h2'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.h2 {...rest} {...props}>
      {children}
    </motion.h2>
  );
};

export const MotionH3 = ({
  delay,
  y,
  x,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'h3'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.h3 {...rest} {...props}>
      {children}
    </motion.h3>
  );
};

export const MotionH4 = ({
  delay,
  y,
  x,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'h4'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.h4 {...rest} {...props}>
      {children}
    </motion.h4>
  );
};

export const MotionText = ({
  delay,
  y,
  x,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'p'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.p {...rest} {...props}>
      {children}
    </motion.p>
  );
};

export const MotionSpan = ({
  y,
  x,
  direction = 'vertical',
  delay,
  children,
  ...props
}: BlurLazyMotionProps<'span'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.span {...rest} {...props}>
      {children}
    </motion.span>
  );
};

export const MotionForm = ({
  delay,
  y,
  x,
  direction = 'vertical',
  children,
  ...props
}: BlurLazyMotionProps<'form'>) => {
  const rest = useMemo(
    () => blurVariant({ delay, y, x, direction }),
    [delay, y, x, direction],
  );
  return (
    <motion.form {...rest} {...props}>
      {children}
    </motion.form>
  );
};
