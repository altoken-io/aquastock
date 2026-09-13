---
name: AquaStock dApp
description: AquaStock's dApp — a Solana public/private infrastructure-funding console for the Stocklana hackathon.
colors:
  primary: 'oklch(0.54 0.22 28)'
  primary-hover: 'oklch(0.57 0.21 30)'
  primary-foreground: 'oklch(0.985 0.003 85)'
  accent: 'oklch(0.57 0.21 30)'
  accent-2: 'oklch(0.72 0.17 60)'
  background: 'oklch(0.978 0.004 75)'
  foreground: 'oklch(0.2 0.012 32)'
  card: 'oklch(0.992 0.003 75)'
  secondary: 'oklch(0.934 0.006 75)'
  muted: 'oklch(0.941 0.006 75)'
  muted-foreground: 'oklch(0.39 0.013 36)'
  border: 'oklch(0.84 0.008 75)'
  destructive: 'oklch(0.58 0.22 25)'
  ok: 'oklch(0.68 0.17 150)'
  warning: 'oklch(0.74 0.16 75)'
typography:
  display:
    fontFamily: 'Geist, ui-sans-serif, system-ui'
    fontSize: 'clamp(1.875rem, 3vw, 2.25rem)'
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: '-0.02em'
  body:
    fontFamily: 'Geist, ui-sans-serif, system-ui'
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Geist, ui-sans-serif, system-ui'
    fontSize: '0.82rem'
    fontWeight: 500
rounded:
  sm: '4px'
  md: '6px'
  lg: '8px'
  xl: '12px'
  panel: '32px'
spacing:
  sm: '8px'
  md: '16px'
  lg: '24px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-secondary:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
  input-default:
    backgroundColor: '{colors.card}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
  card-panel:
    backgroundColor: '{colors.card}'
    rounded: '{rounded.panel}'
---

# Design System: AquaStock dApp

## 1. Overview

**Placeholder palette, inherited mechanism.** The color _values_ below are carried over from this repo's previous project and are a placeholder only — nobody has run AquaStock's own Day 1 visual design pass yet. What's worth keeping is the _mechanism_: OKLCH as the token format, the type-scale approach (Geist, tabular numerals for amounts), and the component-spec pattern (buttons/panels/inputs as named tokens). Treat every color name and hex/OKLCH value in this file as "replace me," not "the brand."

**Creative North Star (working title): "The Public Ledger"**

The AquaStock dApp is where a government position and a community position sit on the same funding table, in the open. Every surface should be built to be read in one glance: a project, a split between government and community funding, a milestone status — never a chart to interpret. The current (inherited, placeholder) tokens lean on a single warm red-orange (`oklch(0.54 0.22 28)`) as primary against a warm off-white canvas.

This system should reject a speculative-crypto aesthetic: no neon gradients, no glassmorphism as a default surface treatment, no token-price decoration. It should also reject a sterile corporate-bank feel — this is public-interest infrastructure funding, not a trading terminal.

**Key Characteristics (inherited, to be revisited on Day 1):**

- One warm accent color carrying primary actions, active states, and focus rings.
- Soft, deep-rounded panels (`dapp-panel` at 32px) over hard-edged cards.
- Geist as the single sans-serif voice across display and body text.
- OKLCH as the canonical color format throughout `globals.css`.

## 2. Colors

The palette below is inherited placeholder content — a single warm red-orange family layered over warm-tinted neutrals, in both a light and dark theme. AquaStock's actual palette (very plausibly should include a blue/water association given the product) is Day 1 work for the team, not decided here.

### Primary

- **Matte Ember** (`oklch(0.54 0.22 28)` / dark: `oklch(0.66 0.2 28)`): primary buttons, active sidebar/nav states, focus rings. Currently doubles as `accent` (`oklch(0.57 0.21 30)`) — splitting primary/accent into two distinct hues is a reasonable Day 1 task.

### Neutral

- **Warm Paper** (`oklch(0.978 0.004 75)` / dark: `oklch(0.13 0.006 35)`): page background.
- **Warm Card** (`oklch(0.992 0.003 75)` / dark: `oklch(0.18 0.008 35)`): cards, sheets, inputs, popovers.
- **Ink** (`oklch(0.2 0.012 32)` / dark: `oklch(0.95 0.004 75)`): headings, amounts, primary text.
- **Muted Ink** (`oklch(0.39 0.013 36)` / dark: `oklch(0.72 0.008 55)`): supporting text, labels, timestamps.
- **Hairline** (`oklch(0.84 0.008 75)` / dark: `oklch(0.26 0.008 35)`): borders, dividers — used at partial opacity (`border/85`, `border/70`) rather than full strength.

### Semantic

- **Danger** (`oklch(0.58 0.22 25)`): errors, destructive actions.
- **OK** (`oklch(0.68 0.17 150)`): completed/verified milestone states.
- **Warning** (`oklch(0.74 0.16 75)`): review-needed or time-sensitive state.

### Named Rules

**The Government/Community Split Rule.** Whatever palette AquaStock lands on, public (government) and private (community) positions need a reliable, colorblind-safe visual distinction (color + icon/label, never color alone) — this is the product's core visual job and should be a deliberate Day 1 decision, not an accident of whichever two accent colors happen to exist.

**The Never-Red-For-Success Rule.** Success and verified states use `ok` (emerald), never the primary accent — reserve the primary hue for actions, not celebration.

## 3. Typography

**Display Font:** Geist (with `ui-sans-serif, system-ui` fallback)
**Body Font:** Geist (same family, functional weights)
**Character:** A single technical-geometric sans carries the whole system. Numerals are tabular where funding amounts need alignment.

### Hierarchy

- **Display** (500 weight, `text-3xl`–`text-4xl`, tight tracking): page-level headings and headline funding totals.
- **Title** (500–600 weight, `text-lg`–`text-xl`): card and section headings.
- **Body** (400 weight, 15px base, 1.6 line-height): default running text, set at the `<body>` level in `globals.css`.
- **Label** (500 weight, ~0.82rem): form labels, nav labels, pills, badges.

### Named Rules

**The One-Voice Rule.** Geist is the only typeface in the system; hierarchy comes from weight and size, not a second family.

## 4. Elevation

Mostly flat with soft ambient shadows rather than hard drop shadows — `dapp-panel` and `.card` use a wide, low-opacity shadow to suggest depth without a visible hard edge. Backdrop blur is used sparingly on fixed chrome (header), not as decoration.

### Shadow Vocabulary

- **Ambient panel** (`box-shadow: 0 18px 60px -40px color-mix(in srgb, var(--background) 85%, transparent)`): default resting shadow under cards and the `.card` utility.
- **Inset surfaces** (`shadow-inner`): search inputs, icon tiles, pills — used to read as recessed rather than raised.

### Named Rules

**The No-Colored-Glow Rule.** Primary-tinted shadows are reserved for the single highest-stakes action per screen (e.g. "connect wallet" or "fund this position"). Do not spread colored glows across every card or button — most surfaces use a neutral ambient shadow only.

## 5. Components

### Buttons

- **Shape:** `rounded-md` (6px) by default across all variants.
- **Primary (`solid`):** `bg-primary` with white text, `hover:bg-accent`, `shadow-sm`.
- **Secondary (`solidLight`):** card background, bordered (`border-border/70`), hover to `secondary/80` — the default button variant in the codebase.
- **Outline / Transparent:** border-only, background appears on hover (`hover:bg-secondary/70`).
- **Semantic variants:** `danger` (red-600), `success` (green-600), `warning` (yellow-600), `info` (blue-600) exist as named CVA variants distinct from the brand primary.

### Cards / Panels

- **`.dapp-panel`:** 32px radius, `border-border/85`, card background, `shadow-sm` — the primary content-panel wrapper. Worth reconsidering (12–16px reads more disciplined) once the real brand personality is set.
- **`.dapp-panel-accent`:** same shape with a subtle primary-tinted gradient wash (`from-primary/6 via-card to-background`) for a single emphasized panel per view — a strong candidate for "this is the government position" vs. "this is the community position" differentiation.
- **`.dapp-panel-muted`:** 16px radius (`rounded-2xl`), background-tinted, `shadow-inner` — for secondary/nested surfaces.
- **Internal padding:** 16–24px, generous around headline numbers, tighter (8–12px) in list rows.

### Inputs / Fields

- **Style:** `rounded-md`, `border-border/70`, card or transparent background depending on `variant`.
- **Focus:** `ring` in `primary/35` (light) or `primary/45` (dark) plus a subtle `hover:shadow-primary/10`.
- **Error:** red-500 border override (`aria-invalid:!border-red-400`) plus a red-500 message line below the field — never color alone.

### Navigation

- **Header (current placeholder shell, `components/dapp-shell.tsx`):** logo + theme/language switchers only — no primary navigation exists yet. Building out real navigation (Home, Project, Milestones, My Impact) is Day 1-3 work.

### Badges / Pills

- **`.badge` / `dapp-pill`:** `rounded-full`, bordered, muted text — low-emphasis metadata (milestone status, investor-type labels).

## 6. Do's and Don'ts

### Do:

- **Do** keep the government/community split visually unambiguous everywhere a position or funding total is shown — pair color with an icon/label, never color alone.
- **Do** use the neutral ambient panel shadow as the default card treatment; reserve any colored glow for one highest-stakes action per screen.
- **Do** pair every status (danger/warning/ok, pending/verified) with an icon and label.
- **Do** keep Geist as the only typeface; differentiate hierarchy through weight/size only.
- **Do** run an actual Day 1 palette decision instead of treating the inherited red-orange as final — this repo's history is not this project's brand.

### Don't:

- **Don't** ship neon gradients, everywhere-glassmorphism, token-price charts as default decoration, or "cyber" crypto-terminal grid backgrounds.
- **Don't** carry the `.dapp-panel`'s 32px radius forward into new surfaces without reconsidering it.
- **Don't** use gradient text or color-only status indicators anywhere in this system.
- **Don't** show a position as funded or a milestone as verified before the chain confirms it.
- **Don't** claim a government partnership, deployed program, or production money movement in UI copy — this is a devnet hackathon demo (see the required disclaimer in PRODUCT.md / packages/locales' `legal` namespace).
