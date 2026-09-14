---
name: AquaStock dApp
description: AquaStock's dApp — a Solana public/private infrastructure-funding console for the Stocklana hackathon.
colors:
  primary: 'oklch(0.52 0.10 200)' # "Reservoir" — teal/cyan, the one brand/CTA color
  primary-hover: 'oklch(0.44 0.10 200)'
  primary-foreground: 'oklch(1 0 0)'
  accent: 'oklch(0.94 0.025 196)' # soft teal tint — hover/highlight surfaces only
  accent-foreground: 'oklch(0.28 0.05 196)'
  public: 'oklch(0.34 0.07 260)' # "Anchor" — government-position tag, never a general accent
  public-foreground: 'oklch(1 0 0)'
  private: 'oklch(0.55 0.13 45)' # "Terra" — community-position tag, never a general accent
  private-foreground: 'oklch(1 0 0)'
  background: 'oklch(1 0 0)' # true neutral scale — zero chroma
  foreground: 'oklch(0.145 0 0)'
  card: 'oklch(1 0 0)'
  secondary: 'oklch(0.96 0 0)'
  muted: 'oklch(0.96 0 0)'
  muted-foreground: 'oklch(0.46 0 0)'
  border: 'oklch(0.90 0 0)'
  destructive: 'oklch(0.58 0.21 25)'
  ok: 'oklch(0.56 0.12 150)'
  warning: 'oklch(0.74 0.15 75)'
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

**Creative North Star: "The Confluence"**

The AquaStock dApp is where a government position and a community position sit on the same funding table, in the open — two sources of capital converging on one project, the way two streams meet at a confluence and become one river. Every surface should be built to be read in one glance: a project, a split between government and community funding, a milestone status — never a chart to interpret.

The palette is built around that convergence: **Reservoir**, a deep teal/cyan, is the one brand/CTA color (water, clarity, the product itself). **Anchor**, a deep institutional navy, and **Terra**, a warm terracotta, are reserved specifically for tagging a position's `investor_type` — public vs. private — never used as a general accent. Cool institutional blue against warm grounded clay is a deliberate pairing: the two capital sources read as distinct and equally legitimate, not as "official" vs. "informal."

This system rejects a speculative-crypto aesthetic: no neon gradients, no glassmorphism as a default surface treatment, no token-price decoration. It also rejects a sterile corporate-bank feel — this is public-interest infrastructure funding, not a trading terminal.

**Key Characteristics:**

- One brand color (Reservoir teal) carrying primary actions, active states, and focus rings — never used for the public/private distinction.
- Two dedicated semantic colors (Anchor navy, Terra terracotta) exist solely to tag investor_type — see the Named Rule below.
- True neutral backgrounds (zero-chroma gray, not the warm off-white this repo inherited) — plain white in light mode, near-black in dark mode.
- Soft, deep-rounded panels (`dapp-panel` at 32px) over hard-edged cards.
- Geist as the single sans-serif voice across display and body text.
- OKLCH as the canonical color format throughout `globals.css`.

## 2. Colors

### Primary

- **Reservoir** (`oklch(0.52 0.10 200)` / dark: `oklch(0.72 0.12 196)`): primary buttons, active sidebar/nav states, focus rings, links.
- **Accent** (`oklch(0.94 0.025 196)` / dark: `oklch(0.28 0.045 196)`): a soft teal-tinted surface for hover states and subtle highlights — not a second CTA color.

### Public / Private (funding-table tags)

- **Anchor** (`oklch(0.34 0.07 260)` / dark: `oklch(0.58 0.09 258)`): tags a `PUBLIC` (government-anchor) position.
- **Terra** (`oklch(0.55 0.13 45)` / dark: `oklch(0.68 0.14 48)`): tags a `PRIVATE` (community/investor) position.

### Neutral

- **Background** (`oklch(1 0 0)` / dark: `oklch(0.13 0 0)`): page background — true white / near-black, zero chroma.
- **Card** (`oklch(1 0 0)` / dark: `oklch(0.19 0 0)`): cards, sheets, inputs, popovers.
- **Foreground** (`oklch(0.145 0 0)` / dark: `oklch(0.98 0 0)`): headings, amounts, primary text.
- **Muted foreground** (`oklch(0.46 0 0)` / dark: `oklch(0.65 0 0)`): supporting text, labels, timestamps.
- **Border** (`oklch(0.9 0 0)` / dark: `oklch(0.28 0 0)`): borders, dividers — used at partial opacity (`border/85`, `border/70`) rather than full strength.

### Semantic

- **Destructive** (`oklch(0.58 0.21 25)`): errors, destructive actions.
- **OK** (`oklch(0.56 0.12 150)` / dark: `oklch(0.7 0.15 150)`): completed/verified milestone states — a leafy green, distinct in hue from both Reservoir and Terra.
- **Warning** (`oklch(0.74 0.15 75)` / dark: `oklch(0.72 0.15 65)`): review-needed or time-sensitive state.

### Named Rules

**The Government/Community Split Rule.** A position always shows its `investor_type` with both color (`public`/`private` token) _and_ an icon or label — never color alone. `public`/`private` are reserved exclusively for this distinction; don't reach for them as a general-purpose second/third accent elsewhere in the UI.

**The Never-Red-For-Success Rule.** Success and verified states use `ok` (green), never `primary` — reserve the brand teal for actions, not celebration.

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

- **`.dapp-panel`:** 32px radius, `border-border/85`, card background, `shadow-sm` — the primary content-panel wrapper on investor-facing marketing-style surfaces (home, auth pages).
- **`.dapp-panel-accent`:** same shape with a subtle primary-tinted gradient wash (`from-primary/6 via-card to-background`) for a single emphasized panel per view (e.g. the funding-goal summary). Use the dedicated `public`/`private` tokens, not this, for the government/community distinction.
- **`.dapp-panel-muted`:** 16px radius (`rounded-2xl`), background-tinted, `shadow-inner` — for secondary/nested surfaces.
- **`.dapp-console-panel`:** 16px radius (`rounded-2xl`), card background, `shadow-sm` — the reconsidered, tighter panel for data-dense surfaces (the admin console: stat tiles, queues, tables). This is the "worth reconsidering" the 32px radius previously flagged here; `.dapp-panel` itself is unchanged for the surfaces it already suited.
- **Internal padding:** 16–24px, generous around headline numbers, tighter (8–12px) in list rows.

### Inputs / Fields

- **Style:** `rounded-md`, `border-border/70`, card or transparent background depending on `variant`.
- **Focus:** `ring` in `primary/35` (light) or `primary/45` (dark) plus a subtle `hover:shadow-primary/10`.
- **Error:** red-500 border override (`aria-invalid:!border-red-400`) plus a red-500 message line below the field — never color alone.

### Navigation

- **Investor-facing (`components/public-shell.tsx`):** logo (links to `/projects` — `/` is the login page, not part of this nav), primary nav (Projects, My Impact), theme/language switchers, a low-emphasis "Staff sign in" text link, and a dismissible sandbox-demo notice bar. Collapses to a Sheet-based drawer below `md`.
- **Admin console (`modules/dashboard/components/dashboard-shell.tsx`):** a dark-first, always-dark sidebar (Command center, Projects, Milestones with a pending-count badge) plus a topbar (page title, signed-in-as chip, language switcher). Collapses to a Sheet-based drawer below `lg`. Deliberately dark regardless of the visitor's site-wide theme choice — see the "Dashboard theme" direction chosen for this console.
- **Auth (`components/auth-shell.tsx`):** a split panel — a dark brand/context panel (with the `ConfluenceRing` signature visual) beside the form, collapsing to a single column on mobile.

### Badges / Pills

- **`.badge` / `dapp-pill`:** `rounded-full`, bordered, muted text — low-emphasis metadata (milestone status, investor-type labels).

## 6. Do's and Don'ts

### Do:

- **Do** keep the government/community split visually unambiguous everywhere a position or funding total is shown — pair the `public`/`private` token with an icon/label, never color alone.
- **Do** use the neutral ambient panel shadow as the default card treatment; reserve any colored glow for one highest-stakes action per screen.
- **Do** pair every status (danger/warning/ok, pending/verified) with an icon and label.
- **Do** keep Geist as the only typeface; differentiate hierarchy through weight/size only.

### Don't:

- **Don't** ship neon gradients, everywhere-glassmorphism, token-price charts as default decoration, or "cyber" crypto-terminal grid backgrounds.
- **Don't** carry the `.dapp-panel`'s 32px radius forward into new surfaces without reconsidering it.
- **Don't** use gradient text or color-only status indicators anywhere in this system.
- **Don't** use `public`/`private` as a general-purpose accent — they exist only to tag investor_type.
- **Don't** show a position as funded or a milestone as verified before the chain confirms it.
- **Don't** claim a government partnership, deployed program, or production money movement in UI copy — this is a devnet hackathon demo (see the required disclaimer in PRODUCT.md / packages/locales' `legal` namespace).
