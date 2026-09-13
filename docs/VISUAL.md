# AquaStock visual system

## Direction

AquaStock should feel like a civic infrastructure console, not a trading app: legible numbers, clear state (pending / verified / funded), and enough restraint that a government contribution and a community contribution read as equally credible side by side. Direct and fast to scan, with enough warmth that "fund a water project" doesn't feel like a spreadsheet.

**This is inherited/placeholder, not a finished AquaStock palette.** The tokens below are what's currently defined in `apps/dapp/DESIGN.md` (carried over from the project this repo was stripped from) — the team's own Day 1 visual pass should treat these as a starting mechanism, not final brand color.

## Current tokens (`apps/dapp/DESIGN.md`)

OKLCH-based, defined once and consumed as Tailwind semantic utilities (`bg-primary`, `text-muted-foreground`, `border-border`, etc.) rather than arbitrary values:

| Token                                      | Value                                           | Role                                                 |
| ------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------- |
| `primary`                                  | `oklch(0.54 0.22 28)`                           | Primary actions, key brand moments.                  |
| `primary-hover`                            | `oklch(0.57 0.21 30)`                           | Press/hover feedback.                                |
| `accent` / `accent-2`                      | `oklch(0.57 0.21 30)` / `oklch(0.72 0.17 60)`   | Secondary emphasis.                                  |
| `background` / `foreground`                | `oklch(0.978 0.004 75)` / `oklch(0.2 0.012 32)` | Page canvas and default text.                        |
| `card`                                     | `oklch(0.992 0.003 75)`                         | Surfaces — cards, panels.                            |
| `secondary` / `muted` / `muted-foreground` | see `DESIGN.md`                                 | Supporting surfaces and text.                        |
| `border`                                   | `oklch(0.84 0.008 75)`                          | Quiet separation.                                    |
| `destructive`                              | `oklch(0.58 0.22 25)`                           | Errors, destructive actions.                         |
| `ok`                                       | `oklch(0.68 0.17 150)`                          | Verified/success states — e.g. a verified milestone. |
| `warning`                                  | `oklch(0.74 0.16 75)`                           | Pending/review states.                               |

Type scale: Geist for display/body/label, sizes defined in `apps/dapp/DESIGN.md`'s `typography` block. Radius scale `sm`–`panel` (4px–32px) and a 3-step spacing scale (`sm`/`md`/`lg`) are also defined there — reuse them rather than introducing new arbitrary values.

## Tailwind token contract

Don't scatter arbitrary values like `bg-[#e6153b]`. Define semantic variables in `:root`/`.dark`, expose them via `@theme inline`, and consume them as semantic utilities. This is already the pattern in the apps' `globals.css` — extend it, don't bypass it.

## What still needs a real design pass

- A public/private (`ok`-style "government confirmed" vs. a distinct community-funding color) visual distinction for the funding-split UI — not yet defined.
- Data-viz treatment for a milestone progress bar / funding-goal progress.
- Whether `apps/web`'s marketing surface should share these exact tokens or use a lighter public-facing variant.

Until that pass happens, prefer the existing token set above over inventing new one-off colors.
