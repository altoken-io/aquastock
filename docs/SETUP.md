# AquaStock local setup

## Prerequisites

- Node.js ≥ 18, pnpm (`packageManager` pins `pnpm@10.30.1` — see root `package.json`).
- Docker, for the local Postgres container.

## Install and run

```bash
pnpm install

# Local Postgres (packages/db-prisma; no Redis — not needed for MVP)
docker compose -f docker-compose.dev.yml up -d
# If port 5432 is already bound (common on WSL with a native Postgres):
#   POSTGRES_HOST_PORT=5434 docker compose -f docker-compose.dev.yml up -d

# Copy each app's env file and fill in values (see docs/ENV_VARS.md)
cp apps/web/.env.example apps/web/.env.local
cp apps/dapp/.env.example apps/dapp/.env.local

# Apply the Prisma schema
pnpm --filter @aquastock/db-prisma exec prisma migrate dev
pnpm --filter @aquastock/db-prisma exec tsx seed.ts   # optional: seed one demo project

pnpm dev            # apps/web on :3000, apps/dapp on :3003
```

Each app's `.env.example` documents its own required variables — there is no shared root `.env`. See `docs/ENV_VARS.md`.

## Validation

- `pnpm check` — the full gate: format, lint, typecheck, test, build. Run this before every commit.
- `pnpm lint` / `pnpm check-types` / `pnpm test` / `pnpm build` — individual checks, workspace-wide.
- `pnpm --filter web <script>` / `pnpm --filter dapp <script>` — scope any script to one app.
- `pnpm clean:cache` — clears every `.next` directory; the fix if dev mode throws a Turbopack "Parsing CSS source code failed" error (a known Tailwind v4 + Turbopack cache-corruption bug — see `CLAUDE.md`).

## Once the Anchor program exists (Day 2+)

Not applicable yet — no `programs/` directory exists in this repo. Once it does, expect an `anchor build` / `anchor test` workflow against a local validator or Devnet; document the actual commands here once the program is scaffolded rather than guessing them now.
