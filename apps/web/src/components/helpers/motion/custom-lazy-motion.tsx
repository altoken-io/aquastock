'use client';

import { FC, memo } from 'react';
import * as motion from 'motion/react-m';
import { type HTMLMotionProps } from 'motion/react';

export type TransformProps = string | number;

export type CustomMotionProps<T extends keyof HTMLElementTagNameMap> = {
  x?: TransformProps;
  y?: TransformProps;
  opacity?: TransformProps;
  scale?: TransformProps;
  rotate?: TransformProps;
  delay?: number;
  type?: 'spring' | 'tween';
  once?: boolean;
  readonly className?: string;
  readonly children?: React.ReactNode;
} & HTMLMotionProps<T>;

export type MotionComponentKeys = keyof typeof motion;

export const spring = {
  damping: 10,
  stiffness: 100,
  duration: 0.3,
} as const;

const parseProps = <T extends keyof HTMLElementTagNameMap>({
  x,
  y,
  delay,
  opacity,
  scale,
  rotate,
  initial,
  animate,
  transition,
  exit,
  type,
  viewport,
  once,
  className,
  children,
  ...props
}: CustomMotionProps<T>) => {
  const initialProps = initial || {
    x: x ?? 0,
    y: y ?? 0,
    rotate: rotate ?? 0,
    scale: scale ?? 0.95,
    opacity: opacity ?? 0,
  };

  const animateProps = animate ?? {
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
  };

  const transitionProps = transition ?? {
    delay: delay ?? 0,
    type: type ?? 'tween',
    ...spring,
  };

  const exitProps = exit ?? {
    x: x ?? 0,
    y: y ?? 0,
    rotate: rotate ?? 0,
    scale: scale ?? 0.95,
    opacity: opacity ?? 0,
  };

  const viewportProps = viewport ?? {
    once: once ?? true,
  };

  return {
    initial: initialProps,
    animate: animateProps,
    transition: transitionProps,
    exit: exitProps,
    viewport: viewportProps,
    className,
    children,
    ...props,
  };
};

const parseInViewProps = <T extends keyof HTMLElementTagNameMap>({
  x,
  y,
  delay,
  opacity,
  scale,
  rotate,
  initial,
  animate,
  transition,
  exit,
  type,
  viewport,
  once,
  className,
  children,
  ...props
}: CustomMotionProps<T>) => {
  const initialProps = initial ?? {
    x: x ?? 0,
    y: y ?? 0,
    rotate: rotate ?? 0,
    opacity: opacity ?? 0,
    scale: scale ?? 0.95,
  };

  const whileInViewProps = animate ?? {
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
  };

  const transitionProps = transition ?? {
    delay: delay ?? 0,
    type: type ?? 'tween',
    ...spring,
  };

  const exitProps = exit ?? {
    x: x ?? 0,
    y: y ?? 0,
    rotate: rotate ?? 0,
    scale: scale ?? 0.95,
    opacity: opacity ?? 0,
  };

  const viewportProps = viewport || {
    once: once ?? true,
  };

  return {
    initial: initialProps,
    whileInView: whileInViewProps,
    transition: transitionProps,
    exit: exitProps,
    viewport: viewportProps,
    className,
    children,
    ...props,
  };
};

export const MotionDiv: FC<CustomMotionProps<'div'>> = ({ ...rest }) => {
  const props = parseProps<'div'>(rest);
  return <motion.div {...props} />;
};

export const MotionAside: FC<CustomMotionProps<'aside'>> = ({ ...rest }) => {
  const props = parseProps<'aside'>(rest);
  return <motion.aside {...props} />;
};

export const MotionIframe: FC<CustomMotionProps<'iframe'>> = ({ ...rest }) => {
  const props = parseProps<'iframe'>(rest);
  return <motion.iframe {...props} />;
};

export const MotionImg: FC<CustomMotionProps<'img'>> = ({ ...rest }) => {
  const props = parseProps<'img'>(rest);
  return <motion.img {...props} />;
};

export const MotionLi: FC<CustomMotionProps<'li'>> = ({ ...rest }) => {
  const props = parseProps<'li'>(rest);
  return <motion.li {...props} />;
};

export const MotionInViewImg: FC<CustomMotionProps<'img'>> = ({ ...rest }) => {
  const props = parseInViewProps<'img'>(rest);
  return <motion.img {...props} />;
};

export const MotionButton: FC<CustomMotionProps<'button'>> = ({ ...rest }) => {
  const props = parseProps<'button'>(rest);
  return <motion.button {...props} />;
};

export const MotionInViewButton: FC<CustomMotionProps<'button'>> = ({
  ...rest
}) => {
  const props = parseInViewProps<'button'>(rest);
  return <motion.button {...props} />;
};

export const MotionHeader: FC<CustomMotionProps<'header'>> = ({ ...rest }) => {
  const props = parseProps<'header'>(rest);
  return <motion.header {...props} />;
};

export const MotionSection: FC<CustomMotionProps<'section'>> = ({
  ...rest
}) => {
  const props = parseProps<'section'>(rest);
  return <motion.section {...props} />;
};

export const MotionMain: FC<CustomMotionProps<'main'>> = ({ ...rest }) => {
  const props = parseProps<'main'>(rest);
  return <motion.main {...props} />;
};

export const MotionNav: FC<CustomMotionProps<'nav'>> = ({ ...rest }) => {
  const props = parseProps<'nav'>(rest);
  return <motion.nav {...props} />;
};

export const MotionVideo: FC<CustomMotionProps<'video'>> = ({ ...rest }) => {
  const props = parseProps<'video'>(rest);
  return <motion.video {...props} />;
};

export const MotionH1: FC<CustomMotionProps<'h1'>> = ({ ...rest }) => {
  const props = parseProps<'h1'>(rest);
  return <motion.h1 {...props} />;
};

export const MotionH2: FC<CustomMotionProps<'h2'>> = ({ ...rest }) => {
  const props = parseProps<'h2'>(rest);
  return <motion.h2 {...props} />;
};

export const MotionH3: FC<CustomMotionProps<'h3'>> = ({ ...rest }) => {
  const props = parseProps<'h3'>(rest);
  return <motion.h3 {...props} />;
};

export const MotionH4: FC<CustomMotionProps<'h4'>> = ({ ...rest }) => {
  const props = parseProps<'h4'>(rest);
  return <motion.h4 {...props} />;
};

export const MotionText: FC<CustomMotionProps<'p'>> = ({ ...rest }) => {
  const props = parseProps<'p'>(rest);
  return <motion.p {...props} />;
};

export const MotionSpan: FC<CustomMotionProps<'span'>> = ({ ...rest }) => {
  const props = parseProps<'span'>(rest);
  return <motion.span {...props} />;
};

export const MotionForm: FC<CustomMotionProps<'form'>> = ({ ...rest }) => {
  const props = parseProps<'form'>(rest);
  return <motion.form {...props} />;
};

export const MotionInViewDiv: FC<CustomMotionProps<'div'>> = ({ ...rest }) => {
  const props = parseInViewProps<'div'>(rest);
  return <motion.div {...props} />;
};

export const MotionInViewHeader: FC<CustomMotionProps<'header'>> = (rest) => {
  const props = parseInViewProps<'header'>(rest);
  return <motion.header {...props} />;
};

export const MotionInViewSection: FC<CustomMotionProps<'section'>> = (rest) => {
  const props = parseInViewProps<'section'>(rest);
  return <motion.section {...props} />;
};

export const MotionInViewMain: FC<CustomMotionProps<'main'>> = (rest) => {
  const props = parseInViewProps<'main'>(rest);
  return <motion.main {...props} />;
};

export const MotionInViewNav: FC<CustomMotionProps<'nav'>> = (rest) => {
  const props = parseInViewProps<'nav'>(rest);
  return <motion.nav {...props} />;
};

export const MotionInViewVideo: FC<CustomMotionProps<'video'>> = (rest) => {
  const props = parseInViewProps<'video'>(rest);
  return <motion.video {...props} />;
};

export const MotionInViewH1: FC<CustomMotionProps<'h1'>> = (rest) => {
  const props = parseInViewProps<'h1'>(rest);
  return <motion.h1 {...props} />;
};

export const MotionInViewH2: FC<CustomMotionProps<'h2'>> = (rest) => {
  const props = parseInViewProps<'h2'>(rest);
  return <motion.h2 {...props} />;
};

export const MotionInViewText: FC<CustomMotionProps<'p'>> = (rest) => {
  const props = parseInViewProps<'p'>(rest);
  return <motion.p {...props} />;
};

export const MotionInViewLi: FC<CustomMotionProps<'li'>> = (rest) => {
  const props = parseInViewProps<'li'>(rest);
  return <motion.li {...props} />;
};

export const MemoMotionDiv = memo(MotionDiv);
export const MemoMotionAside = memo(MotionAside);
export const MemoMotionIframe = memo(MotionIframe);
export const MemoMotionImg = memo(MotionImg);
export const MemoMotionLi = memo(MotionLi);
export const MemoMotionInViewImg = memo(MotionInViewImg);
export const MemoMotionButton = memo(MotionButton);
export const MemoMotionInViewButton = memo(MotionInViewButton);
export const MemoMotionHeader = memo(MotionHeader);
export const MemoMotionSection = memo(MotionSection);
export const MemoMotionMain = memo(MotionMain);
export const MemoMotionNav = memo(MotionNav);
export const MemoMotionVideo = memo(MotionVideo);
export const MemoMotionH1 = memo(MotionH1);
export const MemoMotionH2 = memo(MotionH2);
export const MemoMotionH3 = memo(MotionH3);
export const MemoMotionH4 = memo(MotionH4);
export const MemoMotionText = memo(MotionText);
export const MemoMotionSpan = memo(MotionSpan);
export const MemoMotionForm = memo(MotionForm);
export const MemoMotionInViewDiv = memo(MotionInViewDiv);
export const MemoMotionInViewHeader = memo(MotionInViewHeader);
export const MemoMotionInViewSection = memo(MotionInViewSection);
export const MemoMotionInViewMain = memo(MotionInViewMain);
export const MemoMotionInViewNav = memo(MotionInViewNav);
export const MemoMotionInViewVideo = memo(MotionInViewVideo);
export const MemoMotionInViewH1 = memo(MotionInViewH1);
export const MemoMotionInViewH2 = memo(MotionInViewH2);
export const MemoMotionInViewText = memo(MotionInViewText);
export const MemoMotionInViewLi = memo(MotionInViewLi);
