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

pnpm dev            # apps/web on :3000, apps/dapp on :3003
```

Each app's `.env.example` documents its own required variables — there is no shared root `.env`. See `docs/ENV_VARS.md`.

## Try the whole product locally

```bash
pnpm dev:stack
```

One command, no keys of yours, no real network: a disposable Postgres (port 5434), a local Solana validator with the program and the mainnet Token-2022 build, a demo replica mint and pool, a throwaway browser test wallet (funded with SOL and demo tokens), and the app on <http://localhost:3003/en/pools>. Ctrl+C stops it all. Needs Docker and the Solana/Anchor toolchain (see `docs/PROGRAM.md`).

Pick the "E2E Test Wallet" in the connect dialog to deposit, claim, withdraw or create a pool without a wallet extension. That wallet is registered only on `localnet`. To see the operator console, create a throwaway admin in the local database (there is no public sign-up):

```bash
cd packages/db-prisma
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/aquastock \
DIRECT_URL=postgresql://postgres:postgres@localhost:5434/aquastock \
BETTER_AUTH_SECRET=local-dev-only-placeholder-secret-0123456789abcdef \
BETTER_AUTH_URL=http://localhost:3003 \
  node --experimental-strip-types scripts/create-admin-user.mjs \
    --email admin@local.test --name "Local Admin" --env /dev/null
```

It asks for a password; then sign in at `/`. The stack uses Turbopack because the project's webpack dev server (`pnpm dev`) grows to several GB with the wallet stack loaded and can serve truncated chunks; `pnpm dev:stack --webpack` opts back in.

For a deployed environment (production or a demo account), run the same script pointed at that database instead — for example with `--env .env.prod` holding its `DATABASE_URL`/`DIRECT_URL`/`BETTER_AUTH_SECRET`. Two non-interactive flags avoid typing a password by hand: `--generate-password` has the script generate a strong random one and print it once (nothing is stored anywhere but the database's password hash), or `--password-env SOME_VAR` reads it from an already-set environment variable. Neither puts a password on the command line or in shell history.

## Validation

- `pnpm test:e2e` runs the Playwright golden path (sponsor creates a pool; saver deposits, claims, withdraws and closes) on a desktop and a 390 px viewport. It starts `pnpm dev:stack` itself (or reuses a running one), so it needs Docker and the Solana toolchain and is not part of `pnpm check`. `pnpm test:e2e demo-dry-run` times the demo script's beats.

- `pnpm check` — the full gate: format, lint, typecheck, test, build. Run this before every commit.
- `pnpm lint` / `pnpm check-types` / `pnpm test` / `pnpm build` — individual checks, workspace-wide.
- `pnpm --filter web <script>` / `pnpm --filter dapp <script>` — scope any script to one app.
- `pnpm clean:cache` — clears every `.next` directory. Rarely needed now: the dev-mode "Parsing CSS source code failed" error came from Tailwind's automatic source detection, which `apps/dapp/src/app/[locale]/globals.css` now has switched off (sources are listed explicitly; a package that ships Tailwind classes must be added there).

## The devnet demo

The program is deployed on devnet (`8wnjTUiMQaPxdgfgZdJUGAWBgdPqKoVUAtcWgpgs3GXR`) with the replica mint `EHsntaH73d7s3w84Saj8QGAm4Z6YCCx8v7ZeVEM5kRtJ` (dSPYx). `pnpm program:test` and `pnpm program:smoke` cover the program itself. Two more things make the live app usable by someone who is not on the team; both are signed by the deployer wallet (`~/.config/solana/id.json`), which is the replica mint's authority.

1. **The demo faucet**, so any wallet can get dSPYx and fee SOL from the app (`POST /api/faucet`):

   ```bash
   pnpm solana:faucet --rpc https://api.devnet.solana.com \
     --mint EHsntaH73d7s3w84Saj8QGAm4Z6YCCx8v7ZeVEM5kRtJ --sol 1.5 --tokens 100000
   ```

   The first run creates `programs/keys/faucet-devnet.json` (gitignored, mode 600), a wallet used for nothing else. Paste that file's contents into Vercel as `FAUCET_SECRET_KEY` (server-only) and redeploy. Re-run the same command to top it up: it only adds what is missing. The operator console's Deployment card shows the faucet's balance and says when fewer than ten requests' worth is left. It refuses to run on mainnet, and the app ignores the key on any network but devnet and localnet.

2. **A standing pool** that anyone can deposit into, named and recorded in the activity feed exactly as the create-pool wizard would:

   ```bash
   pnpm solana:demo-pool --rpc https://api.devnet.solana.com \
     --program 8wnjTUiMQaPxdgfgZdJUGAWBgdPqKoVUAtcWgpgs3GXR \
     --mint EHsntaH73d7s3w84Saj8QGAm4Z6YCCx8v7ZeVEM5kRtJ \
     --vesting 600 --window 3888000 --budget 10000 --cap 100 \
     --api https://aquastock-dapp.vercel.app --name "Pool name" --description "..."
   ```

   The live one is `45K6H9DxvtYnmuXQDVjwFn3V4mgLbT3wYLBGfdfTHTSf` (10-minute vesting, open until 2026-11-06, 10,000 dSPYx budget, 100 per saver).
