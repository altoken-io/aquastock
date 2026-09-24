# Placeholder assets

This tracks every place in `apps/web` that renders a placeholder graphic instead of real imagery. **The list is empty**, and nothing is waiting on an asset.

## Photography (generated, final)

- **Hero plate** (`modules/app/assets/confluence.webp`, 1672×941, shown at 16:9 and cropped to 4:3 on phones): an aerial view of a dark river and a sandy river meeting. It is a metaphor for the two streams, not a real place or pool. The pins and the seam drawn over it (`confluence-plate.tsx`) are placed in the photo's own coordinates, so **replacing the photo means re-placing the pins and `SEAM_PATH`**.
- **Closing card** (`modules/app/assets/confluence-blend.webp`): the two waters mixing, dark on the left so the copy sits on it.

Both were generated with GPT Image (the codex-image MCP) and compressed to WebP; the originals are not in the repo.

## Rendered as code, not images

- **Brand mark, favicon, apple icon, OG image**: a single SVG path in `packages/ui/src/brand/mark.ts`, reused by `components/helpers/brand-logo.tsx`, `app/icon.svg`, `app/apple-icon.tsx` and `app/(frontend)/[locale]/opengraph-image.tsx`. If the mark is redesigned, that one file is the only thing to edit.
- **Everything that shows the mechanism**: the hero's pins and vesting seam, the how-it-works pictures (`step-visuals.tsx`), the leave-early bars and the globe. Plain markup, SVG or WebGL with illustrative numbers, labelled as illustrative. They are not screenshots of the product.
