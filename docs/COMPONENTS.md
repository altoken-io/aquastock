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

- `confluence-visual.tsx` — the brand's signature visual (two funding currents converging into one), a thin client wrapper around `@aquastock/animation`'s OGL `Strands` component, dynamically imported and with a static gradient fallback for `prefers-reduced-motion`. Used by `sections/confluence-section.tsx`.
- `funding-table-preview.tsx` — a server-rendered mockup of one project's public/private funding split and milestone checklist, using illustrative demo data (clearly labeled "Example project", matching the same illustrative dataset `apps/dapp` itself now uses — see `apps/dapp/src/lib/demo/projects.ts`).
- `sections/confluence-section.tsx` — pairs the two components above under "The Confluence" framing, between the hero and the how-it-works steps.

## `apps/dapp/src/components`

Three page shells, chosen per page rather than shared in `layout.tsx` (different route groups need different shells; see `loading.tsx`'s own comment for the tradeoff):

- `public-shell.tsx` — the investor-facing shell (projects, project detail, impact — `/` is the login page, not part of this shell; see memory: dapp-home-is-login): logo (links to `/projects`), real primary nav (server component; `helpers/primary-nav.tsx` and `helpers/mobile-nav.tsx` are the two client leaves that need `usePathname`/interactivity), theme/language switchers, a "Staff sign in" link, and `modules/product/components/sandbox-notice-bar.tsx` (the dismissible devnet-demo notice, using the previously-unused `importantNotice` locale namespace).
- `auth-shell.tsx` — split-panel layout for sign-in/forgot-password/reset-password: a dark brand/context panel (with `ConfluenceRing`, see below) beside the form.
- `modules/dashboard/components/dashboard-shell.tsx` — the admin console shell: a dark-first sidebar + topbar. See its own section below.
- `ui/*` — a smaller equivalent kit: `animated-grid-background`, `arrow-button`, `button`, `button-link`, `combobox`, `diagonal-carousel`, `glowing-card`, `infinite-ticker`, `input`, `onboarding-progress-tracker`, `portal`, `textarea`, `vertical-carousel`.
- `helpers/*` — same pattern as `apps/web` (`brand-logo` — inline SVG mark, see `docs/ASSETS.md`; `breadcrumbs`, `container`, `section`, `theme-switcher`, `language-switcher`, `primary-nav`, `mobile-nav`, etc.), plus `update-checker.tsx` (prompts a reload when a new deploy is detected).
- `hooks/use-effect-mount.tsx` — was on an older `useState`-in-effect pattern that could warn/deadlock a component's mounted flag under React 19.2's `useEffectEvent`; ported to match `apps/web`'s `useSyncExternalStore`-based version (SSR-safe, no `setState` inside the effect). If either app's copy is touched again, keep them in sync or promote to a shared package.

## `apps/dapp/src/modules/product` (AquaStock-specific, investor-facing UI)

Shared across project list/detail, My Impact, the admin dashboard, and the `/` sign-in page's `AuthShell` (for `confluence-ring.tsx`) — all driven by the static demo dataset in `src/lib/demo/*` (see below), never a live database.

- `confluence-ring.tsx` — the dApp's own signature visual (see `docs/VISUAL.md`): an SVG ring where a government arc and a community arc close into one circle. Distinct from `apps/web`'s OGL `Strands` canvas — used both as a hero-scale decorative mark and, at data-bound sizes, as the actual funding-split widget.
- `funding-split-bar.tsx`, `investor-type-badge.tsx`, `milestone-status-badge.tsx`, `milestone-timeline.tsx` — the government/community split and milestone-status treatments `docs/VISUAL.md` previously flagged as not yet built; each pairs color with an icon+label per DESIGN.md's Named Rules.
- `project-card.tsx`, `project-image-placeholder.tsx` — the project list card and its abstract on-brand placeholder image (see `apps/dapp/PLACEHOLDER_ASSETS.md` for the real-photography replacement spec).
- `explorer-link.tsx` — a "View on Explorer" affordance that renders inert (not a real, 404-ing devnet link) since every `txSignature` in the demo dataset is fake.
- `sandbox-notice-bar.tsx` — see `public-shell.tsx` above.

## `apps/dapp/src/lib/demo` — the static demo dataset

`projects.ts` (`DEMO_PROJECTS`, plus `getDemoProjectBySlug`/`getDemoProjectSplit`/`getDemoTotals`/`getDemoMilestoneQueue`/`getDemoActivityFeed`) and `impact.ts` (`DEMO_IMPACT_ENTRIES`). Four Peru water-infrastructure projects with government + community positions and a milestone timeline each — the first real consumer of `@aquastock/types`. `projects.test.ts` guards its invariants (unique slugs, `raisedAmount` matching its positions, impact only attached to already-verified milestones). No route handlers or Postgres involved — purely static, checked-in data.

## `apps/dapp/src/modules/dashboard` (AquaStock-specific, admin console)

The staff/government "command center" behind `/dashboard`, `/dashboard/projects`, `/dashboard/milestones` — a dark-first UI (see `docs/VISUAL.md`'s chosen dashboard-theme direction) built over the same demo dataset as the investor-facing UI.

- `dashboard-shell.tsx` — composes `sidebar.tsx` (desktop) + `dashboard-topbar.tsx` (which embeds `mobile-sidebar.tsx`, a Sheet-based drawer below `lg`) + the page content. Forces a `dark` class on its own wrapper div regardless of the visitor's site-wide theme — see the comment there for why `mobile-sidebar.tsx`'s Sheet content has to re-apply that class itself (portaled content escapes the wrapper).
- `sidebar-nav.tsx` — the active-state-aware nav link list (Command center / Projects / Milestones, the last with a pending-count badge), shared by the desktop sidebar and the mobile drawer.
- `stat-tile.tsx`, `milestone-queue.tsx`, `activity-feed.tsx`, `projects-table.tsx`, `demo-data-pill.tsx` — the command center's KPI tiles, verification queue ("Mark verified" stays disabled — no Anchor program yet), activity feed, and projects table.

## `apps/dapp/src/modules/auth/components` — admin console login (AquaStock-specific)

Staff/government email-password login — separate from investor wallet-connect, no public sign-up. See `memory: better-auth-scope`.

- `sign-in-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `sign-out-button.tsx` — client components calling `@/lib/auth/auth-client`, rendered by the matching pages under `src/app/[locale]/{sign-in,forgot-password,reset-password}/page.tsx` (wrapped in `auth-shell.tsx`) and the dashboard pages (`sign-out-button.tsx`, now accepting a `className` so it can be styled inline in the sidebar).
- `src/lib/auth/auth.ts` — server `betterAuth()` config: Prisma adapter (`packages/db-prisma`), email/password only, a `before` hook that blocks `/sign-up/email` (403), `nextCookies()` plugin.
- `src/lib/auth/auth-client.ts` — `createAuthClient` from `better-auth/react`; exports `signIn`/`signOut`/`useSession`/`requestPasswordReset`/`resetPassword` (not `forgetPassword` — that name exists at runtime but isn't in the TS types for this version).
- `src/lib/auth/require-admin-session.ts` — shared server helper (`requireAdminSession(locale)`) used by every `/dashboard/*` page for the real `auth.api.getSession` check.
- `src/proxy.ts` — this app's first middleware: an optimistic cookie-presence redirect guard on `/en/dashboard(/*)` and `/es/dashboard(/*)` (each dashboard page itself does the real check via `require-admin-session.ts`).
- New admin accounts: `pnpm --filter @aquastock/db-prisma create-admin-user` (see `.context/repo/map.md`) — never a route an agent should call itself.

## `packages/animation` (shared, `@aquastock/animation`)

Generic motion/effect components under `src/motion/components` (marquee, blur variants, count-up, curved-loop, dot-pattern background, text-reveal, and others), plus `src/gsap` and `src/ogl` wrappers. No AquaStock-specific compositions.

## Convention

Check `apps/web/src/components` and `apps/dapp/src/components` before assuming a component in one app is available in the other — they are two separate trees with a similar shape, not a shared library (only `packages/ui` and `packages/animation` are actually shared). Promote a component to `packages/ui` only once it has a genuine cross-app use.
