import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // tsconfig keeps `jsx: preserve` for Next. This Vite version (8.x) parses
  // and transforms with its Rust-based oxc toolchain by default, not
  // esbuild, so JSX runtime configuration belongs here under `oxc.jsx`, not
  // `esbuild.jsx` (an `esbuild.jsx` option here is silently ignored --
  // "oxc options will be used and esbuild options will be ignored" -- so
  // don't add one back thinking it does anything). Without this, oxc's
  // parser doesn't treat `.tsx` test files' JSX as JSX at all, and
  // `vite:import-analysis` fails downstream with "Failed to parse source...
  // make sure to not set jsx to preserve". Confirmed 2026-09-02: reproduced
  // locally only after a truly from-scratch reinstall (a stale local
  // node_modules had been masking it the whole time; it never depended on
  // CI specifically, CI's always-fresh install just always exposed it).
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
  test: {
    name: 'dapp',
    environment: 'jsdom',
    passWithNoTests: true,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  server: {
    fs: {
      strict: false,
    },
  },
});
