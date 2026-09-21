# Placeholder assets

This tracks every place in `apps/dapp` that renders a placeholder graphic instead of real imagery. **The list is empty**, and nothing is waiting on an asset: the app has no photography. Pool cards and pool pages show the match ring (`modules/pools/components/match-ring.tsx`, plain SVG) instead of an image, and the brand mark, favicon and OG image are rendered as code from `packages/ui/src/brand/mark.ts` (see `docs/ASSETS.md`).

If real imagery is ever wanted (for example a pool cover image), add the slot here with its ratio and subject first, so the layout does not have to change when the file arrives.
