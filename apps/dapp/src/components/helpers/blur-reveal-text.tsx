'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  useMemo,
  type ReactNode,
} from 'react';

import { motion, useReducedMotion, type Variants } from 'motion/react';

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
type BlurRevealTag =
  'div' | 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type BlurRevealTextProps = Readonly<{
  children: ReactNode;
  as?: BlurRevealTag;
  className?: string;
  delay?: number;
  staggerStep?: number;
  blurPx?: number;
  yOffset?: number;
  duration?: number;
}>;

const splitText = (
  text: string,
  registerKey: () => string,
  variants: Variants,
) => {
  return text.split(/(\s+)/).map((part) => {
    if (!part) {
      return null;
    }
    if (/^\s+$/.test(part)) {
      return part;
    }
    return (
      <motion.span
        key={registerKey()}
        variants={variants}
        className="inline-block will-change-[transform,filter,opacity]"
      >
        {part}
      </motion.span>
    );
  });
};

const transformNode = (
  node: ReactNode,
  registerKey: () => string,
  variants: Variants,
): ReactNode => {
  if (typeof node === 'string') {
    return splitText(node, registerKey, variants);
  }

  if (Array.isArray(node)) {
    return node.map((child) => transformNode(child, registerKey, variants));
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    const nextChildren = transformNode(
      node.props.children,
      registerKey,
      variants,
    );
    return cloneElement(node, { key: node.key ?? registerKey() }, nextChildren);
  }

  return node;
};

const BlurRevealText = ({
  children,
  as: Tag = 'div',
  className,
  delay = 0,
  staggerStep = 0.06,
  blurPx = 10,
  yOffset = 14,
  duration = 0.72,
}: BlurRevealTextProps) => {
  const prefersReducedMotion = useReducedMotion();
  const wordVariant = useMemo(
    () => ({
      hidden: {
        y: yOffset,
        opacity: 0,
        filter: `blur(${blurPx}px)`,
      },
      visible: {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        transition: {
          duration,
          ease,
        },
      },
    }),
    [blurPx, duration, yOffset],
  );

  if (prefersReducedMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  let keyCounter = 0;
  const registerKey = () => `blur-reveal-word-${keyCounter++}`;
  const animatedChildren = Children.map(children, (child) =>
    transformNode(child, registerKey, wordVariant),
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{
        delayChildren: delay,
        staggerChildren: staggerStep,
      }}
    >
      <Tag className={className}>{animatedChildren}</Tag>
    </motion.div>
  );
};

export default BlurRevealText;
