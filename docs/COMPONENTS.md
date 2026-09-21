# AquaStock components

Mostly generic, brand-agnostic component libraries, plus AquaStock-specific product UI in `apps/dapp` (see below) and the marketing-site sections in `apps/web`. Check here before adding a new component; reuse before creating.

## `packages/ui` (shared, `@aquastock/ui`)

- `src/default/{button,card,code}.tsx` — minimal unstyled defaults.
- `src/tw/{avatar,badge,button,button-link,combobox,date-range-picker,dialog,dropdown-menu,input,menu,select,sheet,tabs,textarea,tooltip}.tsx` — a Tailwind/Base-UI-style primitive kit consumed by both apps (e.g. `@aquastock/ui/tw/tooltip`).
- `src/brand/mark.ts` (`@aquastock/ui/brand/mark`) — the AquaStock brand mark as plain SVG path data (not JSX), promoted here because both apps' logo, favicon, apple-icon, and OG image render the identical geometry. See `docs/ASSETS.md`.
- `src/utils/classNames.ts` — `cn()` class-merging helper.

## `apps/web/src/components`

- `ui/*` — a larger shadcn-style kit local to the marketing site: `accordion`, `arrow-button`, `avatar`, `badge`, `button`, `button-link`, `card`, `combobox`, `command`, `diagonal-carousel`, `dialog`, `field`, `glowing-card`, `infinite-ticker`, `input`, `input-group`, `label`, `my-button`, `onboarding-progress-tracker`, `popover`, `portal`, `scroll-area`, `select`, `separator`, `table`, `textarea`, `typewriter`, `vertical-carousel`. `button.tsx`, `button-link.tsx`, and `my-button.tsx` are three separate CVA-based primitives (not interchangeable) — all three now share the same clean semantic-token variant set (`primary`/`secondary`/`outline`/`ghost`/`destructive`; `button-link.tsx` also has `linkText`). Consolidating them into one primitive would be a worthwhile follow-up, not done here.
- `helpers/*` — `brand-logo` (inline SVG mark, see `docs/ASSETS.md`), `breadcrumbs`, `container`, `section`, `blur-reveal-text`, `copy-text-button`, `counter`, `language-switcher`, `theme-switcher` (theme toggle animates via the native View Transitions API — a ripple from the toggle button, see the `::view-transition-*` rules in `globals.css`), `lazy-image`, `lazy-video`, `marquee`, `scroll-down-button`, `submit-button`, plus `helpers/motion/*` (`blur-lazy-motion`, `basic-lazy-motion`, `rich-text-reveal`, `text-reveal`).
- `FaqMenu.tsx` — accordion-style FAQ list, used by `modules/app/components/sections/faq-section.tsx`.

## `apps/web/src/modules/app/components` (AquaStock-specific, home page)

- `confluence-visual.tsx`: the brand's signature visual (two currents converging into one), a thin client wrapper around `@aquastock/animation`'s OGL `Strands` component, dynamically imported and with a static gradient fallback for `prefers-reduced-motion`.
- `hero-ledger-panel.tsx`: the hero's visual anchor, an instrument-panel reading of one illustrative position (deposit, sponsor match, how much has vested). Labelled illustrative.
- `leaving-early-preview.tsx`: a receipt-style ledger of what leaving early at month 3 of 12 means (deposit returned, vested match kept, unvested match returned to the sponsor). Labelled illustrative.
- `vesting-line.tsx`: the vesting rule drawn as an SVG line (no image), with HTML labels so it stays legible when scaled to a narrow column.
- `sections/*`: `hero`, `confluence` (pairs the visual with the leaving-early receipt), `how-it-works`, `use-cases`, `faq` (nine questions, including who controls the token and the program), `early-access-cta`. Copy comes from the `hero`, `confluence`, `howItWorks`, `useCases`, `faq` and `earlyAccessCta` namespaces.

## `apps/dapp/src/components`

Three page shells, chosen per page rather than shared in `layout.tsx` (different route groups need different shells; see `loading.tsx`'s own comment for the tradeoff):

- `public-shell.tsx`: the saver/sponsor shell (pools, create, pool detail, My match; `/` is the sign-in page, not part of this shell; see memory: dapp-home-is-login): logo (links to `/pools`), the primary nav, the wallet button, theme and language switchers, and the dismissible sandbox notice.
- `auth-shell.tsx`: split-panel layout for sign-in/forgot-password/reset-password: a dark brand/context panel (with the match ring on the dark tokens) beside the form.
- `modules/dashboard/components/dashboard-shell.tsx`: the operator console shell: a dark-first sidebar + topbar. See its own section below.
- `ui/*`: a smaller equivalent of the web kit: `animated-grid-background`, `arrow-button`, `button`, `button-link`, `combobox`, `diagonal-carousel`, `glowing-card`, `infinite-ticker`, `input`, `onboarding-progress-tracker`, `portal`, `textarea`, `vertical-carousel`. Wallet screens use `modules/pools/components/actions.tsx` (`ActionButton`, `ActionLink`) instead, which has its own press feedback and focus ring.
- `helpers/*`: same pattern as `apps/web` (`brand-logo`, `breadcrumbs`, `container`, `section`, `theme-switcher`, `language-switcher`, `primary-nav`, `mobile-nav`), plus `update-checker.tsx` (prompts a reload when a new deploy is detected).

## `apps/dapp/src/modules/pools` (AquaStock-specific, the product)

Everything a saver or sponsor sees. Pure logic is in `lib/` (tested without a browser), server reads are in `src/lib/pools`, and the browser only writes by asking the wallet to sign.

- `components/match-ring.tsx`: the Confluence (see `docs/VISUAL.md`): sponsor arc + saver arc closing into one ring, a bezel of 60 ticks filling as the match vests. Pure SVG; `animateIn` draws the arcs in once on hero rings.
- `components/pool-list-view.tsx`, `pool-card.tsx`, `pool-detail-view.tsx`, `issuer-card.tsx` (what the token's issuer can do, read live), `activity-feed.tsx`, `pool-badges.tsx`, `stream-legend.tsx` (`StreamTag`, `LedgerRow`: streams always carry an icon and a label, never colour alone).
- `components/pool-action-panel.tsx`: chooses what a person can do (connect, `deposit-panel`, `position-panel`, or the sponsor's `sponsor-panel`) and owns the one running transaction (`tx-status.tsx`). `confirm-dialog.tsx` wraps the shared Base UI dialog for withdrawals.
- `components/create-pool-wizard.tsx` (+ `create-pool-steps`, `create-pool-fields`, `create-pool-preview`): the four-step create flow; `my-match-view.tsx`: a wallet's positions and totals; `amount-field.tsx`, `notice.tsx`, `actions.tsx`.
- `hooks/`: React Query hooks (`queries.ts`), `use-now.ts` (server-anchored clock), `use-program.ts`, `use-publish-metadata.ts` (wallet-signed pool name).
- `tx/`: `builders.ts` (one builder per instruction; claim, withdraw and reclaim make sure the payout token account exists), `send.ts` (v0 transaction, preflight on, confirm), `use-pool-transaction.ts` (signing / confirming / done / error; then asks the server to record the transaction).
- `lib/`: `format.ts` (locale formatting; nearest by default, `rounding: 'down'` for balances), `deposit-preview.ts` (follows the program's own check order), `create-pool.ts` (form validation against the program's limits), `position-view.ts`, `tx-errors.ts` (every program error has en/es copy, enforced by a test), `demo-cap.ts` (mainnet size cap; closed if unset).
- `token-context.tsx`: live facts about the pool token (symbol, decimals, multiplier, paused, issuer powers, upgrade authority).

## `apps/dapp/src/modules/wallet` and `src/providers`

`wallet-button.tsx` (connect dialog and account menu, using the shared Base UI dialog), `e2e-wallet-adapter.ts` (a test-only wallet adapter that signs with a throwaway key; registered only on `localnet` and stripped from every other build), and `providers/solana-provider.tsx` (mounted by the `(wallet)` route group's layout).

## `apps/dapp/src/modules/product`

Only `sandbox-notice-bar.tsx`, the dismissible "this is a hackathon demo" bar at the top of the wallet pages.

## `apps/dapp/src/modules/dashboard` (AquaStock-specific, operator console)

The staff-only console behind `/dashboard` and `/dashboard/pools`: dark-first, read-only, over real chain data (`src/lib/pools/console.ts`).

- `dashboard-shell.tsx`: composes `sidebar.tsx` (desktop) + `dashboard-topbar.tsx` (which embeds `mobile-sidebar.tsx`, a Sheet-based drawer below `lg`) + the page content. Forces a `dark` class on its own wrapper regardless of the visitor's site-wide theme.
- `sidebar-nav.tsx`: the active-state-aware nav (Overview / Pools), shared by the desktop sidebar and the mobile drawer.
- `stat-tile.tsx`, `activity-feed.tsx`, `pools-table.tsx` (a labelled, focusable scroll region on narrow screens), `deployment-card.tsx` (program, upgrade authority, token, issuer powers, all with explorer links). `lib/console-view.ts` holds the server-side formatters.

## `apps/dapp/src/modules/auth/components`: operator console login (AquaStock-specific)

Staff email-password login, separate from wallet-connect, no public sign-up. See `memory: better-auth-scope`.

- `sign-in-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `sign-out-button.tsx`: client components calling `@/lib/auth/auth-client`.
- `src/lib/auth/auth.ts`: server `betterAuth()` config: Prisma adapter (`packages/db-prisma`), email/password only, a `before` hook that blocks `/sign-up/email` (403), `nextCookies()` plugin.
- `src/lib/auth/auth-client.ts`: `createAuthClient` from `better-auth/react`; exports `signIn`/`signOut`/`useSession`/`requestPasswordReset`/`resetPassword` (not `forgetPassword`: that name exists at runtime but isn't in the TS types for this version).
- `src/lib/auth/require-admin-session.ts`: shared server helper (`requireAdminSession(locale)`) used by every `/dashboard/*` page for the real `auth.api.getSession` check.
- `src/proxy.ts`: an optimistic cookie-presence redirect guard on `/en/dashboard(/*)` and `/es/dashboard(/*)` (each dashboard page itself does the real check).
- New operator accounts: `packages/db-prisma/scripts/create-admin-user.mjs` (see `docs/SETUP.md`); never a route an agent should call itself.

## `packages/animation` (shared, `@aquastock/animation`)

Generic motion/effect components under `src/motion/components` (marquee, blur variants, count-up, curved-loop, dot-pattern background, text-reveal, and others), plus `src/gsap` and `src/ogl` wrappers. No AquaStock-specific compositions.

## Convention

Check `apps/web/src/components` and `apps/dapp/src/components` before assuming a component in one app is available in the other — they are two separate trees with a similar shape, not a shared library (only `packages/ui` and `packages/animation` are actually shared). Promote a component to `packages/ui` only once it has a genuine cross-app use.
