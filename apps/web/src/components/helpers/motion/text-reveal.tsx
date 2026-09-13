'use client';

import { type CSSProperties, useMemo } from 'react';

import { type Transition, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/utils/classNames';

type RevealTag = 'div' | 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type SplitMode = 'lines' | 'words' | 'characters';
type TriggerMode = 'load' | 'view';
type ViewportStart = 'top' | 'center' | 'bottom';
type TransitionKind = 'spring' | 'tween';

type TextRevealProps = Readonly<{
  text: string | string[];
  as?: RevealTag;
  splitBy?: SplitMode;
  trigger?: TriggerMode;
  start?: ViewportStart;
  replay?: boolean;
  className?: string;
  segmentClassName?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  blur?: number;
  x?: number;
  y?: number;
  rotate?: number;
  scale?: number;
  indent?: string;
  transitionKind?: TransitionKind;
  transition?: Transition;
  id?: string;
  style?: CSSProperties;
  'aria-describedby'?: string;
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

const buildAccessibleLabel = (text: string | string[]) =>
  Array.isArray(text) ? text.join(' ') : text.replace(/\n/g, ' ');

const splitWords = (value: string) => value.split(/(\s+)/);

const splitCharacters = (value: string) => Array.from(value);

const renderWhitespace = (value: string, key: string) => {
  if (value.includes('\n')) {
    return value.split('\n').map((part, index, array) => (
      <span key={`${key}-${index}`}>
        {part ? part.replace(/ /g, '\u00A0') : null}
        {index < array.length - 1 ? <br /> : null}
      </span>
    ));
  }

  return value.replace(/ /g, '\u00A0');
};

export function TextReveal({
  text,
  as = 'h2',
  splitBy = 'lines',
  trigger = 'load',
  start = 'center',
  replay = false,
  className,
  segmentClassName,
  lineClassName,
  delay = 0,
  stagger = 0.06,
  duration = 0.78,
  blur = 12,
  x = 0,
  y = 24,
  rotate = 0,
  scale = 0.98,
  indent,
  transitionKind = 'spring',
  transition,
  id,
  style,
  'aria-describedby': ariaDescribedBy,
}: TextRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  // Line mode relies on author-supplied line breaks so the reveal stays stable
  // across breakpoints and avoids expensive DOM measurement.
  const lines = useMemo(() => {
    if (Array.isArray(text)) {
      return text;
    }

    return splitBy === 'lines' ? text.split('\n') : [text];
  }, [splitBy, text]);

  const accessibleLabel = useMemo(() => buildAccessibleLabel(text), [text]);

  const MotionComponent = MOTION_COMPONENTS[as];
  const StaticComponent = as;

  const segmentTransition = useMemo<Transition>(() => {
    if (transition) {
      return transition;
    }

    if (transitionKind === 'spring') {
      return {
        type: 'spring',
        stiffness: 180,
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

  if (prefersReducedMotion) {
    return (
      <StaticComponent
        id={id}
        aria-describedby={ariaDescribedBy}
        className={className}
        style={{ textIndent: indent, ...(style ?? {}) }}
      >
        {Array.isArray(text) ? text.join(' ') : text}
      </StaticComponent>
    );
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
    <MotionComponent
      id={id}
      aria-label={accessibleLabel}
      aria-describedby={ariaDescribedBy}
      className={className}
      style={{ textIndent: indent, ...(style ?? {}) }}
      {...animationProps}
    >
      {lines.map((line, lineIndex) => {
        const lineKey = `${splitBy}-line-${lineIndex}`;

        if (splitBy === 'lines') {
          return (
            <span
              key={lineKey}
              aria-hidden="true"
              className={cn('block overflow-hidden pb-[0.08em]', lineClassName)}
            >
              <motion.span
                custom={lineIndex}
                variants={segmentVariants}
                className={cn(
                  'block will-change-[transform,opacity,filter]',
                  segmentClassName,
                )}
              >
                {line || '\u00A0'}
              </motion.span>
            </span>
          );
        }

        const tokens =
          splitBy === 'words' ? splitWords(line) : splitCharacters(line);

        // Word and character modes keep whitespace outside motion nodes so
        // spacing remains natural while only meaningful glyphs animate.
        return (
          <span
            key={lineKey}
            aria-hidden="true"
            className={cn(
              'block whitespace-pre-wrap',
              splitBy === 'characters' ? 'leading-[0.92]' : undefined,
              lineClassName,
            )}
          >
            {tokens.map((token, tokenIndex) => {
              const tokenKey = `${lineKey}-${tokenIndex}`;

              if (/^\s+$/.test(token)) {
                return (
                  <span key={tokenKey} className="whitespace-pre-wrap">
                    {renderWhitespace(token, tokenKey)}
                  </span>
                );
              }

              return (
                <motion.span
                  key={tokenKey}
                  custom={tokenIndex}
                  variants={segmentVariants}
                  className={cn(
                    'inline-block will-change-[transform,opacity,filter]',
                    splitBy === 'characters' ? 'align-top' : undefined,
                    segmentClassName,
                  )}
                >
                  {token}
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </MotionComponent>
  );
}
