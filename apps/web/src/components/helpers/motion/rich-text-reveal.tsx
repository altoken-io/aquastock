'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
  useMemo,
} from 'react';

import { type Transition, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/utils/classNames';

type RevealTag = 'div' | 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type SplitMode = 'words' | 'characters';
type TriggerMode = 'load' | 'view';
type ViewportStart = 'top' | 'center' | 'bottom';
type TransitionKind = 'spring' | 'tween';

type RichTextRevealProps = Readonly<{
  children: ReactNode;
  as?: RevealTag;
  className?: string;
  segmentClassName?: string;
  trigger?: TriggerMode;
  start?: ViewportStart;
  replay?: boolean;
  splitBy?: SplitMode;
  delay?: number;
  stagger?: number;
  duration?: number;
  blur?: number;
  x?: number;
  y?: number;
  rotate?: number;
  scale?: number;
  transitionKind?: TransitionKind;
  transition?: Transition;
}>;

const MOTION_COMPONENTS = {
  div: motion.div,
  p: motion.p,
  span: motion.span,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
} satisfies Record<RevealTag, typeof motion.div>;

const viewportMargins: Record<ViewportStart, string> = {
  top: '0px 0px -12% 0px',
  center: '-22% 0px -22% 0px',
  bottom: '-40% 0px -4% 0px',
};

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const splitWords = (value: string) => value.split(/(\s+)/);
const splitCharacters = (value: string) => Array.from(value);

const renderWhitespace = (value: string) => value.replace(/ /g, '\u00A0');

export function RichTextReveal({
  children,
  as = 'span',
  className,
  segmentClassName,
  trigger = 'load',
  start = 'center',
  replay = false,
  splitBy = 'words',
  delay = 0,
  stagger = 0.04,
  duration = 0.62,
  blur = 8,
  x = 0,
  y = 20,
  rotate = 0,
  scale = 0.98,
  transitionKind = 'spring',
  transition,
}: RichTextRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionComponent = MOTION_COMPONENTS[as];
  const StaticComponent = as;

  const segmentTransition = useMemo<Transition>(() => {
    if (transition) {
      return transition;
    }

    if (transitionKind === 'spring') {
      return {
        type: 'spring',
        stiffness: 190,
        damping: 24,
        mass: 0.8,
      };
    }

    return {
      duration,
      ease: easeOut,
    };
  }, [duration, transition, transitionKind]);

  const segmentVariants = useMemo(
    () => ({
      hidden: {
        opacity: 0,
        x,
        y,
        rotate,
        scale,
        filter: `blur(${blur}px)`,
      },
      visible: (index: number) => ({
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
          ...segmentTransition,
          delay: delay + index * stagger,
        },
      }),
    }),
    [blur, delay, rotate, scale, segmentTransition, stagger, x, y],
  );

  const animatedChildren = useMemo(() => {
    if (prefersReducedMotion) {
      return children;
    }

    let tokenIndex = 0;

    const nextTokenIndex = () => tokenIndex++;

    // Preserve the semantic tree produced by `t.rich()` and animate only the
    // final text leaves. That keeps translator-controlled markup intact.
    const transformNode = (node: ReactNode): ReactNode => {
      if (typeof node === 'string') {
        const parts =
          splitBy === 'words' ? splitWords(node) : splitCharacters(node);

        return parts.map((part, index) => {
          const key = `rich-token-${tokenIndex}-${index}`;

          if (!part) {
            return null;
          }

          if (/^\s+$/.test(part)) {
            return (
              <span key={key} className="whitespace-pre-wrap">
                {renderWhitespace(part)}
              </span>
            );
          }

          const currentIndex = nextTokenIndex();

          return (
            <motion.span
              key={key}
              custom={currentIndex}
              variants={segmentVariants}
              className={cn(
                'inline-block will-change-[transform,opacity,filter]',
                splitBy === 'characters' ? 'align-top' : undefined,
                segmentClassName,
              )}
            >
              {part}
            </motion.span>
          );
        });
      }

      if (Array.isArray(node)) {
        return node.map((child, index) => (
          <span key={`rich-array-${index}`} className="contents">
            {transformNode(child)}
          </span>
        ));
      }

      if (isValidElement<{ children?: ReactNode }>(node)) {
        const nextChildren = transformNode(node.props.children);
        return cloneElement(node, {
          key: node.key ?? `rich-element-${nextTokenIndex()}`,
          children: nextChildren,
        });
      }

      return node;
    };

    return Children.map(children, (child) => transformNode(child));
  }, [
    children,
    prefersReducedMotion,
    segmentClassName,
    segmentVariants,
    splitBy,
  ]);

  if (prefersReducedMotion) {
    return <StaticComponent className={className}>{children}</StaticComponent>;
  }

  const animationProps =
    trigger === 'view'
      ? {
          initial: 'hidden' as const,
          whileInView: 'visible' as const,
          viewport: {
            once: !replay,
            margin: viewportMargins[start],
          },
        }
      : {
          initial: 'hidden' as const,
          animate: 'visible' as const,
        };

  return (
    <MotionComponent className={className} {...animationProps}>
      {animatedChildren}
    </MotionComponent>
  );
}
