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

## `apps/web` imagery

`public/assets` is empty. The home page's two photographs are statically imported from `apps/web/src/modules/app/assets/` (so `next/image` gets their size and a blur placeholder at build time, and serves them content-hashed):

- `confluence.webp`: the hero plate, two rivers meeting (the sponsor's match and your savings). Pins are placed in its own coordinates; see `apps/web/PLACEHOLDER_ASSETS.md` before replacing it.
- `confluence-blend.webp`: the closing card's background, the two waters mixing.

Both are generated (GPT Image via the codex-image MCP), compressed to WebP with `sharp`. They are atmosphere and metaphor only; the mechanism itself (pins, seam, steps, bars, globe) is drawn in code. The two water-infrastructure photographs the site shipped before the Match Pools pivot were removed with that model.

## `apps/dapp/public/assets`

Empty. The app has no photography: pool cards and pages show the match ring (SVG) instead of an image.

## Using assets

- Before adding a new raster/vector asset, check whether it can instead be
  rendered as code (an inline SVG component, or a `next/og` `ImageResponse`)
  — see the brand mark above for the pattern. Reach for a real file only for
  actual photography or footage.
- `apps/web/PLACEHOLDER_ASSETS.md` and `apps/dapp/PLACEHOLDER_ASSETS.md` say
  what art would be needed if any is wanted; nothing is waiting on an asset.
