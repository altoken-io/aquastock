# AquaStock asset inventory

Public-asset URLs are app-relative: a file in `apps/web/public/assets/brand/og.png` is served by the web app at `/assets/brand/og.png`. `apps/dapp` has its own separate `public/assets` tree — an asset added to one app is not available in the other.

**Everything below is inherited placeholder art from the project this repo was stripped down from.** None of it is AquaStock-branded (it shows the prior product's logo, hero imagery, and OG images). Treat every file here as a placeholder to replace during the team's own Day 1 visual pass, not as approved AquaStock brand material — see `docs/VISUAL.md` for the target direction.

## `apps/web/public/assets`

- `brand/` — `logo-{light,dark}[-transparent][-2].webp` (logo variants, currently the old brand mark), `og{,-2,-3}.{png,webp}` (Open Graph images), `waitlist-meta.png`, `hero-1.jpg`, `hero-2.png` (inherited hero photography, not AquaStock-relevant — a "cross-border payment" scene).
- `favicon/` — standard favicon set (`favicon.ico`, `apple-touch-icon.png`, `android-chrome-{192,512}.png`, `site.webmanifest`) — still the old mark.
- `incentives/` — `free-commission-2.png`, `inca-coin.png`, `stablecoins-1.png` — old product illustrations, not applicable to AquaStock. Safe to delete once nothing references them.
- `marketing/` — `cta{,-3,-4}.webp`, `hero{,-2}.webp` — imagery not currently wired into any component.
- `world-map.svg` — old "send money globally" visual, unused after the world-map marketing section was removed in the strip pass.

## `apps/dapp/public/assets`

- `brand/` — same logo/OG pattern as `apps/web`, still the old mark.
- `favicon/` — same set as `apps/web`, still the old mark.
- `media/` — Next.js default placeholder SVGs (`file`, `globe`, `next`, `vercel`, `window`) — scaffolding leftovers, not used.
- `videos/` — `hero-{1..6}.mp4` and variants — old hero background video loop, not AquaStock content.

## Using assets

- Theme-aware placements (navbar, header) should render both `-light-` and `-dark-` transparent logo variants and toggle visibility with Tailwind's `dark:` classes (see `components/helpers/brand-logo.tsx` in each app) rather than switching `src` at runtime.
- Before adding a new asset, check whether an equivalent already exists in the app's own `public/assets` tree.
- When the team does its Day 1 visual pass, replace the brand/favicon sets first (highest visibility) — the `incentives/`, `marketing/`, and `media/` directories can likely just be deleted since nothing in the stripped UI currently references them.
