# Placeholder assets

This tracks every place in `apps/web` that renders a placeholder graphic instead of real imagery. **The list is empty**, and nothing is waiting on an asset: the marketing site uses no photography.

## Rendered as code, not images

- **Brand mark, favicon, apple icon, OG image**: a single SVG path in `packages/ui/src/brand/mark.ts`, reused by `components/helpers/brand-logo.tsx`, `app/icon.svg`, `app/apple-icon.tsx` and `app/(frontend)/[locale]/opengraph-image.tsx`. If the mark is redesigned, that one file is the only thing to edit.
- **The "Confluence" signature visual** (two currents converging): `packages/animation`'s `Strands` WebGL component, not an image.
- **The gauge rail** (`modules/app/components/gauge-rail.tsx`): the page's scroll-linked side gauge, drawn with CSS/SVG.
- **The hero ledger panel, the "leaving early" receipt and the vesting line** (`hero-ledger-panel.tsx`, `leaving-early-preview.tsx`, `vesting-line.tsx`): plain markup and SVG with illustrative numbers, labelled as illustrative. They are not screenshots of the product.

If real imagery is ever wanted (for example a hero photograph), add the slot here with its ratio and subject first, so the layout does not have to change when the file arrives.
