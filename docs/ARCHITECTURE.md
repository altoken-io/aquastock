# AquaStock architecture

## Current state

This repo currently ships the off-chain shell only. The on-chain program and wallet-connect flow are Day 2-3 work per [ROADMAP.md](ROADMAP.md) — described here as the target, clearly marked where it doesn't exist yet.

## Layers

**On-chain (Solana, not yet built)**
A Solana Anchor program is the source of truth for `Project`, `Position` (`investor_type: public | private`), `Milestone`, and `Impact` accounts, with instructions `create_project`, `create_position`, `fund_position`, `verify_milestone`, `record_impact`, `close_project`. No `programs/` directory or Anchor workspace exists in this repo yet.

**Off-chain cache (Postgres via Prisma, built)**
`packages/db-prisma/prisma/schema.prisma` mirrors the same four entities, each with an `onchainAddress` column to link back to its PDA once the program exists. This is a read/display cache — it does not attempt to be a second source of truth for money movement. `packages/types/src/project.ts` has the matching TypeScript shapes for the two Next.js apps to share.

**Application layer (Next.js, partially built)**

- `apps/web` — public marketing site. Introduces the model, links into the dApp. No accounts, no wallet-connect.
- `apps/dapp` — the actual product surface: wallet-connect, browse projects, fund a position, view milestones, "My Impact." The screens themselves are built (home, project list/detail, My Impact, plus a staff admin console) but run entirely on a static, checked-in demo dataset (`src/lib/demo/*`) — wallet-connect and the route handlers to serve real data are still Day 3+ work. See `docs/ROUTES.md`.

Both apps serve their own data. There is **no separate backend service** — `apps/dapp` reads/writes `packages/db-prisma` through its own Next.js route handlers (none written yet). This intentionally differs from a typical split-service setup: for a 5-day build, one deployable Next.js app per surface is simpler to ship and debug than a Next.js app plus a separate API service.

**Wallet connect (not yet built)**
`apps/dapp` has `@solana/web3.js` installed. `@solana/wallet-adapter-react` and a Phantom/Solflare connector are not yet added — this is Day 3 work.

**Payments (not yet built)**
Solana Pay (transfer request, not the more complex transaction request) is the planned mechanism for funding a position from the dApp — Day 4 work, alongside surfacing the resulting transaction's Solana Explorer link.

## Deployment

`apps/web` and `apps/dapp` deploy to Vercel. There is no Cloud Run service, no Dockerfile, no `cloudbuild.yaml` in this repo — those existed only to deploy the old backend service this repo was stripped down from, and were removed along with it.

## What's deliberately out of scope

Per the hackathon plan: any Hedera integration, a real government MOU/procurement process, real settlement-partner API integrations (demo steps are labeled, e.g. "government contribution confirmed," not backed by a real integration), KYC/AML, real securities structuring, and a multi-project marketplace. See `docs/ROADMAP.md` for the day-by-day cut list.
