'use client';

import type { ComponentProps, CSSProperties } from 'react';
import * as m from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import type { Transition } from 'motion/react';
import { cn } from '../../class-names';

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
  div: m.div,
  p: m.p,
  span: m.span,
  h1: m.h1,
  h2: m.h2,
  h3: m.h3,
  h4: m.h4,
  h5: m.h5,
  h6: m.h6,
} satisfies Record<RevealTag, typeof m.div>;

const viewportMargins: Record<ViewportStart, string> = {
  top: '0px 0px -12% 0px',
  center: '-22% 0px -22% 0px',
  bottom: '-40% 0px -4% 0px',
};

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Build a readable label for screen readers while preserving visual split animations.
function buildAccessibleLabel(text: string | string[]) {
  return Array.isArray(text) ? text.join(' ') : text.replace(/\n/g, ' ');
}

// Split line content into words while keeping whitespace tokens intact.
function splitWords(value: string) {
  return value.split(/(\s+)/);
}

// Split line content into visible characters without losing unicode glyphs.
function splitCharacters(value: string) {
  return Array.from(value);
}

// Preserve spaces and line breaks when whitespace is rendered outside motion nodes.
function renderWhitespace(value: string, key: string) {
  if (value.includes('\n')) {
    return value.split('\n').map((part, index, parts) => (
      <span key={`${key}-${index}`}>
        {part ? part.replace(/ /g, '\u00A0') : null}
        {index < parts.length - 1 ? <br /> : null}
      </span>
    ));
  }

  return value.replace(/ /g, '\u00A0');
}

// Normalize incoming text into stable visual lines without layout measurement.
function getLines(text: string | string[], splitBy: SplitMode) {
  if (Array.isArray(text)) {
    return text;
  }

  return splitBy === 'lines' ? text.split('\n') : [text];
}

// Keep text indent support and a motion-friendly will-change hint for motion nodes.
function getMotionRevealStyle(indent?: string, style?: CSSProperties) {
  return {
    textIndent: indent,
    willChange: 'transform, opacity, filter',
    ...style,
  } as const;
}

// Reuse the same layout styles for reduced-motion output without motion-specific typing.
function getStaticRevealStyle(
  indent?: string,
  style?: CSSProperties,
): CSSProperties {
  return {
    textIndent: indent,
    ...style,
  };
}

// Build the segment transition once from the chosen motion mode.
function getSegmentTransition(
  transitionKind: TransitionKind,
  duration: number,
  transition?: Transition,
): Transition {
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
}

// Create reusable segment variants for line, word, and character reveals.
function getSegmentVariants({
  blur,
  delay,
  rotate,
  scale,
  stagger,
  transition,
  x,
  y,
}: {
  blur: number;
  delay: number;
  rotate: number;
  scale: number;
  stagger: number;
  transition: Transition;
  x: number;
  y: number;
}) {
  return {
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
        ...transition,
        delay: delay + index * stagger,
      },
    }),
  };
}

// Switch between page-load and in-view triggering without duplicating component markup.
function getAnimationProps(
  trigger: TriggerMode,
  replay: boolean,
  start: ViewportStart,
) {
  if (trigger === 'view') {
    return {
      initial: 'hidden' as const,
      whileInView: 'visible' as const,
      viewport: {
        once: !replay,
        margin: viewportMargins[start],
      },
    };
  }

  return {
    initial: 'hidden' as const,
    animate: 'visible' as const,
  };
}

// Render text with configurable line, word, or character reveal animation.
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
  const lines = getLines(text, splitBy);
  const accessibleLabel = buildAccessibleLabel(text);
  const MotionComponent = MOTION_COMPONENTS[as];
  const StaticComponent = as;
  const segmentTransition = getSegmentTransition(
    transitionKind,
    duration,
    transition,
  );
  const segmentVariants = getSegmentVariants({
    blur,
    delay,
    rotate,
    scale,
    stagger,
    transition: segmentTransition,
    x,
    y,
  });
  const animationProps = getAnimationProps(trigger, replay, start);
  const motionRevealStyle = getMotionRevealStyle(indent, style);
  const staticRevealStyle = getStaticRevealStyle(indent, style);

  if (prefersReducedMotion) {
    return (
      <StaticComponent
        id={id}
        aria-describedby={ariaDescribedBy}
        className={className}
        style={staticRevealStyle}
      >
        {accessibleLabel}
      </StaticComponent>
    );
  }

  return (
    <MotionComponent
      id={id}
      aria-label={accessibleLabel}
      aria-describedby={ariaDescribedBy}
      className={className}
      style={motionRevealStyle as ComponentProps<typeof m.div>['style']}
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
              <m.span
                custom={lineIndex}
                variants={segmentVariants}
                className={cn(
                  'block will-change-[transform,opacity,filter]',
                  segmentClassName,
                )}
              >
                {line || '\u00A0'}
              </m.span>
            </span>
          );
        }

        const tokens =
          splitBy === 'words' ? splitWords(line) : splitCharacters(line);

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
                <m.span
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
                </m.span>
              );
            })}
          </span>
        );
      })}
    </MotionComponent>
  );
}
