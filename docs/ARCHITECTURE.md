# AquaStock architecture

## Current state

Everything below is built and runs end to end on a local validator (`pnpm dev:stack`). Nothing is deployed: no program id, mint or keypair exists outside the local validator, and deploys are run by a human (see [PROGRAM.md](PROGRAM.md)).

## Layers

**On-chain (Solana, built)**
The Match Pools Anchor program in `programs/` is the source of truth for pools, positions and balances. See [PROGRAM.md](PROGRAM.md) for the frozen interface, trust model and issuer risks.

**Off-chain data (Postgres via Prisma, built)**
`packages/db-prisma` holds only what the chain cannot: descriptive text for a pool and a feed of transactions the server has re-read from the chain. It never holds funds or rules. See [DATABASE.md](DATABASE.md).

**Application layer (Next.js, built)**

- `apps/web`: public marketing site. Explains the model with illustrative, labelled visuals and links into the dApp. No accounts, no wallet-connect.
- `apps/dapp`: the product. Wallet pages (`/pools`, `/pools/new`, `/pools/[address]`, `/my-match`) live in the `(wallet)` route group, whose layout mounts the wallet provider so only those pages load web3.js, Anchor and the wallet adapter. The operator console (`/dashboard`) is Better Auth-gated and read-only. Its `/` route is the operator sign-in page, not a marketing home (see memory: dapp-home-is-login).

Both apps serve their own data. There is **no separate backend service**: `apps/dapp` reads the program and `packages/db-prisma` through its own Next.js route handlers (the Match Pools API, see [ROUTES.md](ROUTES.md)). The browser never writes to the chain except by asking the person's wallet to sign; afterwards it asks the server to record the transaction, and the server re-reads it from the chain before storing anything.

**Wallet connect (built)**
`@solana/wallet-adapter-react` with Wallet Standard auto-detection: any installed Wallet Standard wallet (Phantom, Solflare, Backpack...) appears without per-wallet adapters. A throwaway test wallet is registered only when `NEXT_PUBLIC_SOLANA_NETWORK` is `localnet` and `NEXT_PUBLIC_E2E_WALLET_SECRET` is set; the build strips it everywhere else (verified: it is absent from the production bundle).

**Amounts**
Token amounts are BigInt end to end. The mint uses a scaled UI amount multiplier, so a typed amount is converted through the multiplier (rounding up, so it displays as typed) and a balance is displayed rounded down (so it is never overstated). See `apps/dapp/src/lib/solana/amounts.ts`.

**Styling**
Tailwind v4 in `apps/dapp` has automatic source detection off and lists its sources explicitly (`globals.css`): auto-detection walked pnpm symlinks into node_modules and produced corrupted class candidates that broke the dev server and the production build. A package that ships Tailwind classes must be added to that list.

**Payments**
There is no Solana Pay flow. Funding is a direct token transfer inside the program's instructions, signed by the wallet. Buying SPYx is a link out to Jupiter; the app sells nothing.

## Deployment

`apps/web` and `apps/dapp` deploy to Vercel. There is no Cloud Run service, no Dockerfile, no `cloudbuild.yaml` in this repo — those existed only to deploy the old backend service this repo was stripped down from, and were removed along with it.

## What's deliberately out of scope

Any Hedera integration, KYC/AML, real securities structuring, a token swap inside the app (the app links out to Jupiter), a devnet demo-token faucet (it would need a server-held mint key, which contradicts "no server signing key"), governance or upgrade tooling for the program, and a multi-project marketplace. See [PIVOT_PLAN.md](PIVOT_PLAN.md) for the cut order.
