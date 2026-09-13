# Placeholder assets to replace

This tracks every place in `apps/web` that renders a placeholder graphic instead of
real photography, so it can be generated later (e.g. with Codex / an image model)
and swapped in without touching component code. Everything else visual on the
site (the brand mark, favicon, OG image, the "Confluence" animation, the funding
table preview) is rendered as code — vector or `next/og` — on purpose, so it never
goes stale and needs no image asset at all. This file is the complete list; if a
new placeholder is added later, add it here too.

## 1. Hero visual — water infrastructure photography

- **Placeholder file:** `apps/web/public/assets/brand/hero-infrastructure-placeholder.svg`
- **Used in:** `apps/web/src/modules/app/components/sections/hero-section.tsx` (the
  panel to the right of the headline on `lg:` and up)
- **Replace with:** a real, landscape-honest photo of water infrastructure —
  a reservoir, dam, aqueduct, or water-treatment plant. Peru/Latam-appropriate
  setting preferred (the hackathon spec and likely audience are Peru-facing),
  but any credible public-infrastructure water scene works.
- **Brief:**
  - Orientation: portrait, ~4:5 aspect ratio (matches the placeholder's
    500×625 viewBox).
  - Real, grounded, documentary-style — not a stock-photo "clean tech" render,
    not an aerial drone cliché. This is the one place on the page that says
    "this is about real, physical infrastructure," so it should look like a
    place, not an illustration.
  - Daylight, natural color. Avoid heavy color grading — the page places a
    dark gradient/scrim over the bottom third of this image for text
    legibility if a caption is ever added, so keep the bottom third
    relatively simple (sky, water, or a plain structure) rather than a busy
    focal point.
  - License: must be usable commercially (own photography, a properly
    licensed stock photo, or a generated image cleared for commercial use).
- **File name/format once ready:** replace
  `apps/web/public/assets/brand/hero-infrastructure-placeholder.svg` with
  `apps/web/public/assets/brand/hero-infrastructure.jpg` (or `.webp`) and
  update the single `src` reference in `hero-section.tsx` accordingly — the
  component renders it through `next/image`, so any reasonably-sized source
  (≥1000px on the long edge) is fine.

## Deliberately not on this list

These render as code, not images, and don't need a placeholder:

- **Brand mark / favicon / apple icon / OG image** — a single SVG path in
  `apps/web/src/lib/brand/mark.ts`, reused by `components/helpers/brand-logo.tsx`,
  `app/icon.svg`, `app/apple-icon.tsx`, and
  `app/(frontend)/[locale]/opengraph-image.tsx` (the last two via
  `next/og`'s `ImageResponse`). If the mark itself is redesigned later, that
  one file is the only thing to edit.
- **The "Confluence" signature visual** (two funding streams converging) —
  `packages/animation`'s `Strands` WebGL component, not an image.
- **The funding-table preview card** — plain markup with illustrative demo
  data, clearly labeled as an example, not a screenshot of the real product
  (the dApp's own UI doesn't exist yet — see `docs/ROADMAP.md`).
