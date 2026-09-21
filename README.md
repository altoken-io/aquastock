# AquaStock

AquaStock is a Solana dApp built for the Stocklana hackathon (NYC): **Match Pools**, the employer match for people without an employer. A sponsor locks tokens in a pool and sets the rules. A saver deposits tokenized SPYx (a Token-2022 mint whose issuer keeps real controls); the matching amount is reserved for them on-chain in the same transaction and vests in a straight line. Leave early and you keep your deposit and whatever has vested; the rest returns to the sponsor.

The on-chain side is an Anchor program in `programs/` (`Config`, `Pool` and `Position` accounts plus a vault; instructions `init_config`, `create_pool`, `fund_match`, `deposit`, `claim_vested`, `withdraw`, `reclaim_unmatched`, `close_position`). Its interface is frozen in `docs/PROGRAM.md`. The off-chain side is a Postgres layer (`packages/db-prisma`) that holds pool names and a verified activity feed, served through `apps/dapp`'s own Next.js route handlers. The chain is the source of truth for every number; there is no separate backend service, and no server holds a signing key.

**Demo — this does not constitute an offer of securities.** / **Demo — no constituye una oferta de valores.** The program is unaudited. Read `docs/PIVOT_PLAN.md` for the status and the open risks.

## Core Stack

- pnpm workspaces + Turborepo
- TypeScript
- Next.js (App Router), `next-intl` (en/es), Tailwind v4
- Anchor 1.2 (Rust), Token-2022
- `@solana/web3.js`, `@anchor-lang/core`, `@solana/wallet-adapter-react` (Wallet Standard auto-detection)
- Prisma + Postgres, Better Auth (operator console only)
- ESLint + Prettier, Vitest

## Workspace Layout

```text
apps/
  web/    Next.js public marketing site (en/es)
  dapp/   Next.js AquaStock app: pools, deposit/claim/withdraw, sponsor tools, operator console
programs/ Anchor workspace (Rust, outside the pnpm workspace)

packages/
  ui/          shared UI primitives
  locales/     i18n message source (en/es)
  config/      shared TS/ESLint/Tailwind config
  animation/   shared motion/animation utilities
  types/       API DTOs and the program's typed IDL
  db-prisma/   Prisma schema + client (pool metadata and activity)
```

## Try It Locally

```bash
pnpm install
pnpm dev:stack     # Postgres, a local validator, a demo pool, a test wallet, and the app on :3003
```

Open <http://localhost:3003/en/pools> and choose "E2E Test Wallet". No keys of yours and no real network are involved. See `docs/SETUP.md` for the operator console and the rest.

## Useful Commands

- `pnpm check`: the full validation gate: format, lint, typecheck, test, build
- `pnpm lint` / `pnpm check-types` / `pnpm test` / `pnpm build`: individual workspace-wide checks
- `pnpm program:test`: build the program (SBPF v0) and run its unit, property and LiteSVM tests
- `pnpm program:smoke`: run the whole product flow against a local validator
- `pnpm --filter dapp dev` / `pnpm --filter web dev`: run a single app
- Deploys are run by a human with their own wallet: `pnpm program:keygen`, then `pnpm program:deploy` (see `docs/PROGRAM.md`)

## Team Conventions

- Use `pnpm` only (do not commit `package-lock.json` files).
- Put reusable logic in `packages/*`, app-specific logic in `apps/*`.
- Keep env secrets out of git; each app has its own `.env.example`, and `docs/ENV_VARS.md` lists every variable.
- Keep i18n message keys in `packages/locales` and consume via `next-intl`; en/es parity is enforced by a test.
