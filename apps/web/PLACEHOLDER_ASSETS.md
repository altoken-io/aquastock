# Placeholder assets to replace

This tracks every place in `apps/web` that renders a placeholder graphic
instead of real photography. The list is currently empty: the homepage uses
production image assets in `apps/web/public/assets/brand/`
(`process-site-verification.webp`, generated to match the brief this file
used to carry — a municipal engineer and a community member inspecting
water infrastructure together — and `site-notice.webp`, a community water
reservoir in an Andean valley at sunset, used behind the closing panel).

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
- **The gauge rail** (`modules/app/components/gauge-rail.tsx`) — the page's
  scroll-linked staff-gauge signature visual, drawn entirely with CSS/SVG,
  not an image.
- **The funding-table preview and hero ledger panel** — plain markup with
  illustrative demo data, clearly labeled as an example, not a screenshot of
  the real product (matching the same illustrative dataset `apps/dapp` itself
  uses — neither app reads from a live database yet, see `docs/ROADMAP.md`).
