# @aquastock/animation

Internal animation package for shared, tree-shakeable animation imports.

## Import Guidelines

Prefer subpath imports so consumers only pull the code they use:

```ts
import { motion, AnimatePresence } from '@aquastock/animation/motion/react';
import * as m from '@aquastock/animation/motion/react-m';
import { LazyMotionProvider } from '@aquastock/animation/motion/provider';
import { BlurDiv, BlurH1 } from '@aquastock/animation/motion/components';
import { Renderer, Camera, Transform } from '@aquastock/animation/ogl';
```

## Design Notes

- No root barrel export on purpose.
- Explicit subpath exports are easier for bundlers to optimize.
- `sideEffects: false` allows aggressive dead-code elimination.
- `transpilePackages` in the Next app ensures workspace TypeScript is compiled reliably.
- `LazyMotionProvider` uses `LazyMotion` with `domAnimation` and `strict` enabled by default.
- Reusable blur primitives are built on `motion/react-m` for lower bundle cost inside `LazyMotion`.
