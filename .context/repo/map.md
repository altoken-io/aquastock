# AquaStock repository map

A Solana dApp built for the Stocklana hackathon (NYC): a government "anchor" investor and community/private investors co-fund water-infrastructure projects, with positions, milestones, and impact tracked on-chain. This map is a navigation aid — verify against the actual files before editing, and update it when structure meaningfully changes.

## Workspace

- `apps/web`: public marketing site (Next.js, `en`/`es` via `next-intl` + `@aquastock/locales`). Routes: `/` (home — Hero, HowItWorks, UseCases, Faq, EarlyAccessCta sections), `/privacy`, `/terms` (rendered through `modules/app/components/legal/legal-page.tsx`). No accounts, no KYC — pure marketing/informational site that hands off to `apps/dapp` for wallet-connect.
- `apps/dapp`: the actual product. **Current build state: a placeholder only** — `src/app/[locale]/page.tsx` renders a minimal "coming soon"-style home page inside `components/dapp-shell.tsx` (logo + theme/language switchers, no real navigation yet). No wallet-connect, no project browsing, no funding flow, no My Impact page exist yet — those are Day 1-3 work per the team's build plan. `@solana/web3.js` is an installed dependency; `@solana/wallet-adapter-*` is not yet added.
- `packages/ui`: generic shadcn/Base-UI-style component primitives (`src/default/{button,card,code}.tsx`, `src/tw/{avatar,badge,button,button-link,combobox,date-range-picker,dialog,dropdown-menu,input,menu,select,sheet,tabs,textarea,tooltip}.tsx`). No AquaStock-specific components yet.
- `packages/config`: shared eslint (`eslint/{base,next,react-internal}.js`), typescript (`typescript/{base,nextjs,react-library}.json`), and tailwind (`tailwind/preset.cjs`) presets. Generic, consumed by every app/package.
- `packages/animation`: generic motion/gsap/ogl effect components (marquee, blur, count-up, curved-loop, dot-pattern, text-reveal, etc. under `src/motion/components`). No AquaStock-specific compositions.
- `packages/locales`: i18n content + loader. `src/index.ts` exports `getLocale()`/`locales`/`SupportedLocale`; `src/en.ts` / `src/es.ts` assemble the full per-locale message object from `src/content/{en,es}/*.json`. Current namespaces: `common`, `cookies`, `earlyAccessCta`, `faq`, `footer`, `hero`, `home`, `howItWorks`, `impact`, `importantNotice`, `legal`, `metadata`, `milestones`, `navbar`, `newsletter`, `privacy`, `project`, `terms`, `useCases`, `validation`. `impact`/`milestones`/`project` namespaces are scaffolded ahead of the UI that will consume them (Day 1-3 work). Both apps' `src/lib/i18n/types/global.d.ts` type-augments `IntlMessages` from this package, so `t('some.key')` calls are compile-time checked against these JSON files — a missing key is a `tsc` error, not just a runtime one.
- `packages/types`: shared transport types. `src/project.ts` mirrors the off-chain Project/Position/Milestone/Impact shapes (and the planned on-chain account types) — `ProjectStatus`, `InvestorType` (`PUBLIC`|`PRIVATE`), `MilestoneStatus`, `Position`, `Milestone`, `Impact`, `Project`.
- `packages/db-prisma`: PostgreSQL Prisma schema — the off-chain cache/display layer mirroring the Solana program's account types (see `prisma/schema.prisma`): `Project`, `Position` (`investorType: PUBLIC|PRIVATE`), `Milestone`, `Impact`, each with an `onchainAddress` linking back to its on-chain PDA once the program exists. `lib/prisma.ts` exports a `PrismaClient` singleton built on the `@prisma/adapter-pg` driver adapter, plus `createPrismaClient(connectionString)` for a second connection when needed. `seed.ts` seeds one demo project with a public + a private position and a milestone timeline.

## What does NOT exist yet (do not assume otherwise)

- **No Solana Anchor program / `programs/` directory.** The on-chain `Project`/`Position`/`Milestone`/`Impact` accounts and their instructions (`create_project`, `create_position`, `fund_position`, `verify_milestone`, `record_impact`, `close_project`) are unbuilt — Day 2 work per the hackathon plan. `packages/db-prisma`'s schema and `packages/types` are the off-chain mirror, written ahead of the program to unblock UI work, not a substitute for it.
- **No wallet-adapter wiring.** `apps/dapp` has `@solana/web3.js` installed but no `@solana/wallet-adapter-react`/`-phantom`/etc. and no connect-wallet UI.
- **No `apps/api`.** There is no separate backend service. Off-chain project/position/milestone/impact data is meant to be served through `apps/dapp`'s own Next.js route handlers (none written yet) directly against `packages/db-prisma` — not a Fastify/Express gateway.
- **No `apps/mobile`.** Web-only (`apps/web` + `apps/dapp`).
- **No accounts / auth.** No Better Auth, no login, no KYC — the product is pure wallet-connect once built.
- **No real project/position/milestone content.** `packages/db-prisma/seed.ts` seeds one placeholder demo project; real project data is the team's own input.

## Commands

- `pnpm dev`: runs `apps/web` (port 3000) and `apps/dapp` (port 3003) together.
- `pnpm dev:web` / `pnpm dev:dapp`: run one app only.
- `pnpm lint`, `pnpm check-types`, `pnpm test`, `pnpm format` (writes) / `pnpm format:check` (verifies): workspace quality checks via Turborepo.
- `pnpm check`: full validation gate — `format` then `turbo run lint check-types test build`. Run before every commit/PR. `workflows/check.yml` runs the same (minus the Next.js builds, which need real env and are built by Vercel) on every push/PR against a throwaway Postgres service container.
- `pnpm clean:cache` (`scripts/clean-next-cache.js`): clears every `.next` directory in the workspace — the fix for Tailwind v4 + Turbopack dev-mode cache corruption (see CLAUDE.md).
- `pnpm secrets:scan` (`scripts/scan-secrets.sh`, rules in `.gitleaks.toml`): gitleaks over full git history.
- `docker compose -f docker-compose.dev.yml up -d`: disposable local Postgres only (no Redis) for `packages/db-prisma` — credentials match the local `DATABASE_URL` convention (`postgresql://postgres:postgres@localhost:5432/aquastock`); override `POSTGRES_HOST_PORT` if 5432 is already bound.
- `pnpm --filter @aquastock/db-prisma exec prisma migrate dev` / `prisma studio`: schema migrations / DB browser.

## Conventions

- Use pnpm and Turborepo; keep feature code in its owning app until it has a stable shared contract.
- Public and dApp pages are locale-aware under `[locale]`; keep `en`/`es` namespace parity in `packages/locales` — `apps/dapp/src/lib/i18n/locale-parity.test.ts` enforces this (same namespace files, identical key paths, in both locales) and fails CI on drift.
- Prisma schema/migrations (`packages/db-prisma`) own the off-chain database; once the Anchor program exists, it is the source of truth for on-chain state, and the Prisma rows are a cache/display layer keyed by `onchainAddress`.
- Docs in `/docs` describe product direction, architecture, and development rules — see each doc's own header for current relevance (some still reference the prior project this repo was built from and are being rewritten separately).
- `apps/web/PRODUCT.md`, `apps/dapp/PRODUCT.md`, `apps/dapp/DESIGN.md` are the current brand/product/design references for UI work (see CLAUDE.md's "UI and styling rules").
