# AquaStock visual system

## Direction

AquaStock should feel like a civic infrastructure console, not a trading app: legible numbers, clear state (pending / verified / funded), and enough restraint that a government contribution and a community contribution read as equally credible side by side.

**Creative north star: "The Confluence."** Two capital sources — government and community — converge on one project, the way two streams meet and become one river. **Reservoir**, a deep teal/cyan, is the one brand color (water, clarity, the product itself). **Anchor** (institutional navy) and **Terra** (warm terracotta) exist solely to tag a position as public or private — never as a general accent. Cool institutional blue against warm grounded clay is deliberate: neither capital source should read as more "official" than the other.

## Palette

Defined once in `apps/web/src/app/globals.css` and `apps/dapp/src/app/[locale]/globals.css` (`:root` / `.dark`), consumed as Tailwind semantic utilities (`bg-primary`, `text-public-foreground`, `border-border`) — never as arbitrary values.

| Token                                     | Light                               | Dark                                  | Role                                                                                        |
| ----------------------------------------- | ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `primary` ("Reservoir")                   | `oklch(0.52 0.10 200)`              | `oklch(0.72 0.12 196)`                | The one brand/CTA color — buttons, links, focus rings.                                      |
| `accent`                                  | `oklch(0.94 0.025 196)`             | `oklch(0.28 0.045 196)`               | Soft teal-tinted hover/highlight surface — not a second CTA color.                          |
| `public` ("Anchor")                       | `oklch(0.34 0.07 260)`              | `oklch(0.58 0.09 258)`                | Tags a `PUBLIC` (government-anchor) position. Reserved for this — never a general accent.   |
| `private` ("Terra")                       | `oklch(0.55 0.13 45)`               | `oklch(0.68 0.14 48)`                 | Tags a `PRIVATE` (community/investor) position. Reserved for this — never a general accent. |
| `ok`                                      | `oklch(0.56 0.12 150)`              | `oklch(0.7 0.15 150)`                 | Verified/success states — a leafy green, distinct from both `primary` and `private`.        |
| `warning`                                 | `oklch(0.74 0.15 75)`               | `oklch(0.72 0.15 65)`                 | Pending/review states.                                                                      |
| `destructive`                             | `oklch(0.58 0.21 25)`               | `oklch(0.62 0.2 25)`                  | Errors, destructive actions.                                                                |
| `background` / `foreground`               | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.13 0 0)` / `oklch(0.98 0 0)` | True neutral (zero chroma) — plain white/near-black, not a warm or cool tint.               |
| `card` / `secondary` / `muted` / `border` | see globals.css                     | see globals.css                       | Same true-neutral scale, stepped for surface hierarchy.                                     |

`chart-1..5` map to `primary`, `ok`, `warning`, `private`, `public` in that order — data-viz colors are the actual semantic palette, not arbitrary chart hues.

## The public/private rule

A position always shows its `investor_type` with **both** the `public`/`private` color token **and** an icon or label — never color alone (colorblind-safe, and legible in a demo screenshot). These two tokens exist only for this distinction; don't reach for them as a general second/third accent elsewhere in the UI. See `apps/dapp/DESIGN.md`'s "Government/Community Split Rule."

## Type scale

Geist for display/body/label (`apps/dapp/DESIGN.md`'s `typography` block has exact sizes). Radius scale `sm`–`panel` (4px–32px) and a 3-step spacing scale (`sm`/`md`/`lg`) are also defined there — reuse them rather than introducing new arbitrary values.

## Tailwind token contract

Don't scatter arbitrary values like `bg-[#0c7489]`. Define semantic variables in `:root`/`.dark`, expose them via `@theme inline`, and consume them as semantic utilities — this is already the pattern in both apps' `globals.css`.

## What still needs a real design pass

- A milestone-status data-viz treatment inside the dApp itself (project detail, My Impact) — `apps/web`'s home page now has a funding-goal progress bar (`modules/app/components/funding-table-preview.tsx`) using the `public`/`private` tokens as a preview of the concept, but the dApp's own real version doesn't exist yet.
- Whether `apps/dapp` should visually echo the marketing site's "Confluence" treatment once its real UI is built, or develop its own equivalent.

`apps/web`'s home page now leans into `public`/`private` visually on purpose — see `modules/app/components/sections/confluence-section.tsx` and the government/community position chips in the hero — as a deliberate, hero-scoped exception to "dApp-scoped only." The "Confluence" signature visual itself is built: `modules/app/components/confluence-visual.tsx`, an OGL `Strands` composition from `packages/animation`.

Until the remaining items get a real pass, prefer the existing token set above over inventing new one-off colors.
