# AquaStock visual system

## Direction

AquaStock should feel like an instrument panel, not a trading app: legible numbers, exact state (vesting / vested / claimed / withdrawn), and enough restraint that the sponsor's match and the saver's own savings read as two equally credible currents of one position.

**Creative north star: "The Confluence."** Two sources, the sponsor's match and your own savings, converge into one position, the way two streams meet and become one river. **Reservoir**, a deep teal/cyan, is the one brand color. **Anchor** (institutional navy) is the sponsor's match and **Terra** (warm terracotta) is the saver's savings; they exist only to tell those two streams apart. The signature element is the **match ring** (`apps/dapp/src/modules/pools/components/match-ring.tsx`): the two streams as arcs closing into one ring, with a bezel of 60 ticks that fills in green as the match vests, so time is visible on the same instrument as the money.

## Palette

Defined once in `apps/web/src/app/globals.css` and `apps/dapp/src/app/[locale]/globals.css` (`:root` / `.dark`), consumed as Tailwind semantic utilities (`bg-primary`, `text-public-foreground`, `border-border`) — never as arbitrary values.

| Token                                     | Light                               | Dark                                  | Role                                                                                        |
| ----------------------------------------- | ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `primary` ("Reservoir")                   | `oklch(0.52 0.10 200)`              | `oklch(0.72 0.12 196)`                | The one brand/CTA color — buttons, links, focus rings.                                      |
| `accent`                                  | `oklch(0.94 0.025 196)`             | `oklch(0.28 0.045 196)`               | Soft teal-tinted hover/highlight surface — not a second CTA color.                          |
| `public` ("Anchor"), alias `sponsor`      | `oklch(0.34 0.07 260)`              | `oklch(0.63 0.09 258)`                | The sponsor's match. Reserved for this — never a general accent.                            |
| `private` ("Terra"), alias `saver`        | `oklch(0.55 0.13 45)`               | `oklch(0.68 0.14 48)`                 | The saver's own savings. Reserved for this — never a general accent.                        |
| `ok`                                      | `oklch(0.56 0.12 150)`              | `oklch(0.7 0.15 150)`                 | Vested, confirmed and success states: a leafy green, distinct from `primary` and `private`. |
| `ok-text`                                 | `oklch(0.4 0.1 150)`                | `oklch(0.78 0.15 150)`                | `ok` for small text on a tinted `ok` surface (`ok` itself is 3.9:1 there; AA needs 4.5:1).  |
| `warning`                                 | `oklch(0.74 0.15 75)`               | `oklch(0.72 0.15 65)`                 | Closing soon, partial match, paused: things to read before acting.                          |
| `destructive`                             | `oklch(0.58 0.21 25)`               | `oklch(0.62 0.2 25)`                  | Errors, destructive actions.                                                                |
| `background` / `foreground`               | `oklch(1 0 0)` / `oklch(0.145 0 0)` | `oklch(0.13 0 0)` / `oklch(0.98 0 0)` | True neutral (zero chroma) — plain white/near-black, not a warm or cool tint.               |
| `card` / `secondary` / `muted` / `border` | see globals.css                     | see globals.css                       | Same true-neutral scale, stepped for surface hierarchy.                                     |

`chart-1..5` map to `primary`, `ok`, `warning`, `private`, `public` in that order — data-viz colors are the actual semantic palette, not arbitrary chart hues.

## The sponsor/saver rule

The two streams always appear with **both** their color token **and** an icon or label (`StreamTag`, `LedgerRow`), never color alone: colorblind-safe, and legible in a greyscale demo screenshot. The two tokens exist only for this distinction; don't reach for them as a general accent. Small text that must stay legible on tinted surfaces uses the AA-checked tokens above, and every screen is swept for contrast (WCAG AA) in both themes.

## Motion

Motion is restrained and one thing gets the boldness: the match ring draws in once on the two hero rings (the pool page and your position). Everything else is short: panels, wizard steps and status messages swap in with a 200 ms fade and a 6 px rise (a transition on `@starting-style`, so it can be interrupted), buttons scale to 0.97 on press, and data transitions on the ring are 300 ms. All of it uses one strong ease-out (`--dapp-ease-out`). Under `prefers-reduced-motion` movement is dropped and fades stay. Nothing animates that a keyboard user triggers repeatedly. Utilities: `dapp-enter`, `dapp-arc-in` in `apps/dapp/src/app/[locale]/globals.css`.

## Type scale

Geist for display/body/label (`apps/dapp/DESIGN.md`'s `typography` block has exact sizes). Radius scale `sm`–`panel` (4px–32px; wallet screens use the 16px `dapp-console-panel`, not the 32px `dapp-panel`) and a 3-step spacing scale (`sm`/`md`/`lg`) are also defined there — reuse them rather than introducing new arbitrary values.

## Tailwind token contract

Don't scatter arbitrary values like `bg-[#0c7489]`. Define semantic variables in `:root`/`.dark`, expose them via `@theme inline`, and consume them as semantic utilities — this is already the pattern in both apps' `globals.css`.

## Resolved

- **The dApp draws its own Confluence**, distinct from the marketing site's: the match ring is a plain SVG (so it renders on the server, closes into one shape at hero scale and shrinks to a card thumbnail), while `apps/web` shows the same two streams as a real-looking confluence: the "Meeting of Waters" hero.
- **`apps/web` ("Meeting of Waters")**: the hero is an aerial photograph of a dark river and a sandy river meeting (`confluence-plate.tsx`), annotated like a map: sponsor's match (the dark water, Anchor), your savings (the sandy water, Terra), matched on deposit (where they meet), yours as it vests (the seam, with month ticks, drawn downstream once on load). The photo is metaphor only; everything that states the mechanism is code: the how-it-works pictures (`step-visuals.tsx`), the leave-early bars (real vesting arithmetic from `lib/leave-early.ts`, labelled illustrative) and the globe of illustrative routes (`world-globe.tsx` over `@aquastock/ui/tw/globe`).
  - **Palette.** The web keeps the shared semantic tokens but tints its neutrals cool: a "mist" page (`--background`), white cards, and "abyss" bands (`--abyss*` in `apps/web/src/app/globals.css`: the globe band and the closing card, dark in both themes with their own AA-checked text, rule and stream colours).
  - **Type.** Funnel Display (headlines, used large and tight), Funnel Sans (body), Geist Mono (figures and short labels; the dApp's mono, so the handoff reads as one product).
  - **Motion.** One orchestrated moment: a first-visit intro curtain (the drop fills, then lifts), the headline rising, the pins popping in order, the seam drawing itself downstream. Everything else is quiet: scroll-driven reveals (CSS `animation-timeline: view()`, no JS, content simply visible where unsupported), the two-way marquee, the globe turning once every 80 s and pausing off screen. Reduced motion skips the curtain, the travel and the drifting drop, holds the marquee and the globe still, and keeps fades.
  - Streams keep the rule: `public`/`private` (and `--abyss-sponsor`/`--abyss-saver` on the dark bands) always sit next to a label or icon.

## What still needs a real design pass

- The operator console's dark-first sidebar (`apps/dapp/src/modules/dashboard/components/`) has had one pass. Its pools table scrolls horizontally on phones (a labelled, focusable scroll region); a card layout for narrow screens would read better.
- No real brand photography exists; `apps/dapp/PLACEHOLDER_ASSETS.md` and `apps/web/PLACEHOLDER_ASSETS.md` list what would need art if any is wanted.

Until those get a real pass, prefer the existing token set above over inventing new one-off colors.
