# AquaStock components

Generic, brand-agnostic component libraries — no AquaStock-specific UI exists yet (Day 1-3 work per `docs/ROADMAP.md`). Check here before adding a new component; reuse before creating.

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
- `funding-table-preview.tsx` — a server-rendered mockup of one project's public/private funding split and milestone checklist, using illustrative demo data (clearly labeled "Example project" — the dApp's real project UI doesn't exist yet). This is the "public/private funding-table visual" `docs/VISUAL.md` flagged as not yet built anywhere.
- `sections/confluence-section.tsx` — pairs the two components above under "The Confluence" framing, between the hero and the how-it-works steps.

## `apps/dapp/src/components`

- `dapp-shell.tsx` — the current app shell: brand mark + wordmark, theme switcher, language switcher, rendered inside `app/[locale]/page.tsx` (not the layout) — this is the one component that will need real navigation once Day 1-3 UI work lands (project list, project detail, My Impact); moving it into `layout.tsx` at that point would let `loading.tsx` cover just `<main>` instead of the whole page.
- `ui/*` — a smaller equivalent kit: `animated-grid-background`, `arrow-button`, `button`, `button-link`, `combobox`, `diagonal-carousel`, `glowing-card`, `infinite-ticker`, `input`, `onboarding-progress-tracker`, `portal`, `textarea`, `vertical-carousel`.
- `helpers/*` — same pattern as `apps/web` (`brand-logo` — inline SVG mark, see `docs/ASSETS.md`; `breadcrumbs`, `container`, `section`, `theme-switcher`, `language-switcher`, etc.), plus `update-checker.tsx` (prompts a reload when a new deploy is detected).
- `hooks/use-effect-mount.tsx` — was on an older `useState`-in-effect pattern that could warn/deadlock a component's mounted flag under React 19.2's `useEffectEvent`; ported to match `apps/web`'s `useSyncExternalStore`-based version (SSR-safe, no `setState` inside the effect). If either app's copy is touched again, keep them in sync or promote to a shared package.

## `packages/animation` (shared, `@aquastock/animation`)

Generic motion/effect components under `src/motion/components` (marquee, blur variants, count-up, curved-loop, dot-pattern background, text-reveal, and others), plus `src/gsap` and `src/ogl` wrappers. No AquaStock-specific compositions.

## Convention

Check `apps/web/src/components` and `apps/dapp/src/components` before assuming a component in one app is available in the other — they are two separate trees with a similar shape, not a shared library (only `packages/ui` and `packages/animation` are actually shared). Promote a component to `packages/ui` only once it has a genuine cross-app use.
