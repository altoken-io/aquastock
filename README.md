# AquaStock

AquaStock is a Solana dApp built for the Stocklana hackathon (NYC): a government "anchor" investor and community/private investors co-fund water-infrastructure projects in the same funding table, tracked on-chain. Each position is tagged `investor_type: public` (government) or `private` (community/diaspora/outside investors), and progress is tracked against on-chain milestones as projects deliver.

The on-chain side is a Solana Anchor program (`Project`, `Position`, `Milestone`, `Impact` accounts; instructions `create_project`, `create_position`, `fund_position`, `verify_milestone`, `record_impact`, `close_project` — not yet built in this repo, see `docs/ROADMAP.md`). The off-chain side is a Postgres cache of the same four entities (`packages/db-prisma`), served through `apps/dapp`'s own Next.js route handlers — there is no separate backend service.

**Demo — this does not constitute an offer of securities.** / **Demo — no constituye una oferta de valores.**

## Core Stack

- pnpm workspaces + Turborepo
- TypeScript
- Next.js (App Router)
- Prisma + Postgres
- Solana (`@solana/web3.js`, wallet-adapter, Anchor — program not yet built)
- ESLint + Prettier

## Workspace Layout

```text
apps/
  web/    Next.js public marketing site (en/es)
  dapp/   Next.js AquaStock app — wallet connect, projects, positions, milestones, impact

packages/
  ui/          shared UI primitives
  locales/     i18n message source (en/es)
  config/      shared TS/ESLint/Tailwind config
  animation/   shared motion/animation utilities
  types/       shared domain types (Project/Position/Milestone/Impact)
  db-prisma/   Prisma schema + client (the off-chain cache)
```

## Getting Started

```bash
pnpm install
docker compose -f docker-compose.dev.yml up -d   # local Postgres
pnpm --filter @aquastock/db-prisma exec prisma migrate dev
pnpm dev                                         # web on :3000, dapp on :3003
```

## Useful Commands

- `pnpm check` — the full validation gate: format, lint, typecheck, test, build
- `pnpm lint` / `pnpm check-types` / `pnpm test` / `pnpm build` — individual workspace-wide checks
- `pnpm --filter dapp dev` / `pnpm --filter web dev` — run a single app
- `pnpm clean:cache` — clear every `.next` directory (see CLAUDE.md's Turbopack cache-corruption note)

## Team Conventions

- Use `pnpm` only (do not commit `package-lock.json` files).
- Put reusable logic in `packages/*`, app-specific logic in `apps/*`.
- Keep env secrets out of git; each app has its own `.env.example`.
- Keep i18n message keys in `packages/locales` and consume via `next-intl`.
