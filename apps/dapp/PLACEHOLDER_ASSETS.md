# Placeholder assets to replace

This tracks every place in `apps/dapp` that renders a placeholder graphic
instead of real photography. Every slot below is currently rendered by
`src/modules/product/components/project-image-placeholder.tsx` — an abstract,
on-brand gradient wash (using the `--public`/`--primary`/`--private` tokens)
with a subtle topographic-line motif, not a plain gray box, so demo
screenshots still look intentional. Replace it with real documentary
photography per project once available, matching the ratio exactly so no
layout changes are needed.

## Project card thumbnail

- **Where:** `modules/product/components/project-card.tsx` (project list/grid,
  `/[locale]/projects`) and the home page's "Active projects" section.
- **Ratio:** 4:3 landscape (`ratio="card"`).
- **Suggested dimensions:** 1200 × 900px.
- **Subject:** landscape documentary photography of that specific project's
  water infrastructure (the treatment plant, well, desalination unit, or
  irrigation canal named on the card) in its real setting — matching
  `apps/web/public/assets/brand/hero-infrastructure.webp`'s documentary style,
  not stock/generic water imagery.
- **Alt text:** none needed on the placeholder (it's `aria-hidden`, decorative
  — the project name/location already render as real text beside it); once
  replaced with a real photo, give it a real `alt` describing the specific
  scene (e.g. "Filtration tanks at the Río Verde treatment plant site").

## Project detail hero banner

- **Where:** `/[locale]/projects/[slug]` (project detail page), directly under
  the "Back to projects" link.
- **Ratio:** 21:9 ultra-wide (`ratio="hero"`).
- **Suggested dimensions:** 2100 × 900px.
- **Subject:** same documentary style as the card thumbnail, but a wider
  establishing shot of the project site — the kind of image that reads well
  as a full-bleed banner.

## Deliberately not on this list

These render as code, not images, and don't need a placeholder:

- **Brand mark / favicon / apple icon / OG image** — a single SVG path in
  `packages/ui/src/brand/mark.ts` (`@aquastock/ui/brand/mark`), reused by
  `components/helpers/brand-logo.tsx`, `app/icon.svg`, `app/apple-icon.tsx`,
  and `app/[locale]/opengraph-image.tsx`. See `docs/ASSETS.md`.
- **The "Confluence" signature visual** — `modules/product/components/confluence-ring.tsx`,
  an inline SVG (two arcs closing into one ring), not an image. This is the
  dApp's own answer to the visual question `docs/VISUAL.md` left open —
  distinct from `apps/web`'s OGL "Strands" canvas, on purpose.
- **Milestone/impact icons and status badges** — `lucide-react` icons, not
  images.
