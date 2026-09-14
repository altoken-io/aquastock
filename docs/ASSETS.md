# AquaStock asset inventory

Public-asset URLs are app-relative. `apps/dapp` has its own separate
`public/assets` tree — an asset added to one app is not available in the
other.

**Both apps' old inherited (pre-AquaStock) brand/favicon/incentives/marketing/video
assets have been removed** — they showed the prior product's logo, hero
photography, and hero video loops, and are gone from `public/assets` and from
every component that referenced them. The brand mark, favicon, apple touch
icon, and OG image are now rendered as code instead of raster/vector files
(see below) in both apps, so most of what used to live in
`public/assets/brand` and `public/assets/favicon` no longer needs a checked-in
file at all.

## Rendered as code, not files (both apps)

- **Brand mark** — a single SVG path in `packages/ui/src/brand/mark.ts`
  (`@aquastock/ui/brand/mark`), shared by both apps' `components/helpers/brand-logo.tsx`
  (inline SVG, no raster asset), `app/icon.svg` (favicon), `app/apple-icon.tsx`,
  and each app's `opengraph-image.tsx` (the last two via `next/og`'s
  `ImageResponse`). Change the mark once, in `mark.ts`, and every surface it
  appears on in both apps updates.
- **Manifest icon** — each app's `app/manifest.ts` points at its own `/icon.svg`
  directly; no separate `android-chrome-*.png` set.

## `apps/web/public/assets`

- `brand/process-site-verification.webp` — portrait documentary photograph of
  a municipal engineer and a community member inspecting water-treatment
  infrastructure together, used beside the homepage's "The Process" steps.
- `brand/site-notice.webp` — wide documentary photograph of a community water
  reservoir in an Andean valley at sunset, used behind the homepage's closing
  panel under a teal overlay.

Both were generated (see `apps/web/PLACEHOLDER_ASSETS.md` for the brief each
was generated against) for the 2026 marketing-site redesign (the
"Gauge"/instrument direction — see `apps/web/PRODUCT.md`), replacing the
three photos this app shipped before that redesign
(`hero-infrastructure.webp`, `how-it-works.webp`, `early-access-cta.webp` —
the new layout dropped the hero photo entirely in favor of the hero ledger
panel).

## `apps/dapp/public/assets`

Empty. Project photography (project cards, the project detail hero banner)
is rendered as an abstract on-brand placeholder in code
(`src/modules/product/components/project-image-placeholder.tsx`) rather than
a checked-in file for now — see `apps/dapp/PLACEHOLDER_ASSETS.md` for the
exact ratio/dimensions each slot needs so real photography can drop in
later without a layout change.

## Using assets

- Before adding a new raster/vector asset, check whether it can instead be
  rendered as code (an inline SVG component, or a `next/og` `ImageResponse`)
  — see the brand mark above for the pattern. Reach for a real file only for
  actual photography or footage.
- Check `apps/web/PLACEHOLDER_ASSETS.md` and `apps/dapp/PLACEHOLDER_ASSETS.md`
  before adding a new placeholder — each tracks the imagery still awaiting a
  production asset in that app.
