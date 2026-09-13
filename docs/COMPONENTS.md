# AquaStock components

Generic, brand-agnostic component libraries — no AquaStock-specific UI exists yet (Day 1-3 work per `docs/ROADMAP.md`). Check here before adding a new component; reuse before creating.

## `packages/ui` (shared, `@aquastock/ui`)

- `src/default/{button,card,code}.tsx` — minimal unstyled defaults.
- `src/tw/{avatar,badge,button,button-link,combobox,date-range-picker,dialog,dropdown-menu,input,menu,select,sheet,tabs,textarea,tooltip}.tsx` — a Tailwind/Base-UI-style primitive kit consumed by both apps (e.g. `@aquastock/ui/tw/tooltip`).
- `src/utils/classNames.ts` — `cn()` class-merging helper.

## `apps/web/src/components`

- `ui/*` — a larger shadcn-style kit local to the marketing site: `accordion`, `arrow-button`, `avatar`, `badge`, `button`, `button-link`, `card`, `combobox`, `command`, `diagonal-carousel`, `dialog`, `field`, `glowing-card`, `infinite-ticker`, `input`, `input-group`, `label`, `my-button`, `onboarding-progress-tracker`, `popover`, `portal`, `scroll-area`, `select`, `separator`, `table`, `textarea`, `typewriter`, `vertical-carousel`.
- `helpers/*` — `brand-logo`, `breadcrumbs`, `container`, `section`, `blur-reveal-text`, `copy-text-button`, `counter`, `language-switcher`, `theme-switcher`, `lazy-image`, `lazy-video`, `marquee`, `scroll-down-button`, `submit-button`, plus `helpers/motion/*` (`blur-lazy-motion`, `basic-lazy-motion`, `rich-text-reveal`, `text-reveal`).
- `FaqMenu.tsx` — accordion-style FAQ list, used by `modules/app/components/sections/faq-section.tsx`.

## `apps/dapp/src/components`

- `dapp-shell.tsx` — the current app shell: logo, theme switcher, language switcher. This is the one component that will need real navigation once Day 1-3 UI work lands (project list, project detail, My Impact).
- `ui/*` — a smaller equivalent kit: `animated-grid-background`, `arrow-button`, `button`, `button-link`, `combobox`, `diagonal-carousel`, `glowing-card`, `infinite-ticker`, `input`, `onboarding-progress-tracker`, `portal`, `textarea`, `vertical-carousel`.
- `helpers/*` — same pattern as `apps/web` (`brand-logo`, `breadcrumbs`, `container`, `section`, `theme-switcher`, `language-switcher`, etc.), plus `update-checker.tsx` (prompts a reload when a new deploy is detected).

## `packages/animation` (shared, `@aquastock/animation`)

Generic motion/effect components under `src/motion/components` (marquee, blur variants, count-up, curved-loop, dot-pattern background, text-reveal, and others), plus `src/gsap` and `src/ogl` wrappers. No AquaStock-specific compositions.

## Convention

Check `apps/web/src/components` and `apps/dapp/src/components` before assuming a component in one app is available in the other — they are two separate trees with a similar shape, not a shared library (only `packages/ui` and `packages/animation` are actually shared). Promote a component to `packages/ui` only once it has a genuine cross-app use.
