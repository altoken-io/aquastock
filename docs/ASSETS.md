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

- `brand/hero-infrastructure.webp` — portrait documentary photography of a
  water-treatment facility in an Andean setting, used as the homepage hero's
  supporting visual.
- `brand/how-it-works.webp` — portrait documentary photography of a municipal
  and community representative verifying a water-treatment site together,
  used beside the homepage process steps.
- `brand/early-access-cta.webp` — wide documentary photograph of a community
  water project in an Andean valley, used behind the homepage closing CTA.

## `apps/dapp/public/assets`

Empty — the inherited `brand/`, `favicon/`, `media/` (Next.js scaffolding
leftovers), and `videos/` directories are gone. Nothing in the current
placeholder shell needs an image asset (see `components/dapp-shell.tsx` /
`app/[locale]/page.tsx`); add real assets here once actual product screens
(project imagery, etc.) are built.

## Using assets

- Before adding a new raster/vector asset, check whether it can instead be
  rendered as code (an inline SVG component, or a `next/og` `ImageResponse`)
  — see the brand mark above for the pattern. Reach for a real file only for
  actual photography or footage.
- Check `apps/web/PLACEHOLDER_ASSETS.md` before adding a new placeholder —
  it tracks any imagery still awaiting a production asset.
