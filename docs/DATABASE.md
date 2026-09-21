# AquaStock database

Postgres (Neon in production) through Prisma, in `packages/db-prisma`. **The Solana program is the source of truth for every pool, position and balance.** The database only holds what the chain cannot: descriptive text for a pool, and a feed of transactions the server has verified. It never holds funds or rules, and no row can change how a pool behaves.

The Better Auth tables (`user`, `session`, `account`, `verification`) serve the operator console only; see `apps/dapp/src/lib/auth`.

## Models

**`Pool`** — descriptive data for a pool that exists on-chain. `onchainAddress` (unique, the pool PDA, base58), `programId` (which deployment it belongs to, so devnet and mainnet rows never mix), `sponsorWallet`, `poolId` (the sponsor's u64, `Decimal(20,0)`), `name`, `description?`, timestamps (`timestamptz`). A row is created only after the server confirms the pool on-chain: either the sponsor saves a name (wallet-signed) or the first verified activity for the pool arrives, which creates a default-named row (`Pool #<id>`) that never overwrites a sponsor's text.

**`PoolActivity`** — one verified event from a Match Pools transaction, for the activity feed and Explorer links. `kind` (`POOL_CREATED | MATCH_FUNDED | DEPOSITED | CLAIMED | WITHDRAWN | UNMATCHED_RECLAIMED | POSITION_CLOSED`), `wallet`, `amount?` and `matchAmount?` (raw units, `Decimal(20,0)`; on a deposit `matchAmount` is the match reserved, on a withdrawal the match forfeited), `txSignature`, `eventIndex`, `occurredAt` (the block time). `(txSignature, eventIndex)` is unique, so recording a transaction twice is a no-op. Rows are written only after the server re-reads the transaction from the chain.

## Design choices

- **Types:** `timestamptz` for times, exact `numeric` for token amounts (a u64 does not fit in `bigint`), `text` for strings, `cuid()` keys like the rest of the schema.
- **Indexes:** every foreign key is covered (`PoolActivity.poolId` leads the feed index); `(poolId, occurredAt DESC, id DESC)` serves the feed and keyset pagination; `Pool(programId, createdAt DESC)` and `Pool(sponsorWallet)` serve listing.
- **Writes are atomic upserts** (`INSERT ... ON CONFLICT`), so concurrent requests cannot race.
- **Pagination is keyset**, not `OFFSET`: the cursor is the `(occurredAt, id)` of the last row seen.
- **CHECK constraints** back up the server's zod validation: name 1–80 chars, description ≤ 500, base58 address and signature shapes, amounts and `poolId` within u64, `eventIndex >= 0`. They live in the migration SQL because Prisma does not model them.
- **Deleting a pool cascades** to its activity.

## Migrations

`packages/db-prisma/prisma/migrations` is the history:

1. `init`, `add_better_auth_tables`: the original schema and the auth tables.
2. `add_pool_tables`: `Pool`, `PoolActivity` and their constraints.
3. `drop_water_funding_tables`: removes `Project`, `Position`, `Milestone`, `Impact` and their enums, the model this app used before the pivot. **It refuses to run if any of those tables holds rows** (a guard at the top of the SQL), so it cannot silently delete data. If it aborts on an environment you care about, export the rows, empty the tables, run `prisma migrate resolve --rolled-back 20260920192447_drop_water_funding_tables`, and deploy again.

A full replay from an empty database, and a schema-versus-migrations diff, both come out clean.

## Local development

`docker-compose.dev.yml` runs a disposable Postgres. Port 5432 is often taken (a Windows-side Postgres forwarded into WSL, for example), so override it:

```bash
POSTGRES_HOST_PORT=5434 docker compose -f docker-compose.dev.yml up -d
export DATABASE_URL=postgresql://postgres:postgres@localhost:5434/aquastock
export DIRECT_URL=$DATABASE_URL
pnpm --filter @aquastock/db-prisma exec prisma migrate deploy
```

`prisma migrate dev` (creating a new migration) is the same with `migrate dev`. Exported variables win over a root `.env`, so this can never reach Neon by accident.

## Neon

`DATABASE_URL` is the **pooled** URL (host contains `-pooler`, with `?sslmode=require`) and is what the app uses. `DIRECT_URL` is the **direct** URL and is what `prisma migrate` uses. The free tier suspends after about five minutes idle, so ping the database before a demo. The production role should hold only `SELECT`, `INSERT` and `UPDATE` on these tables; migrations run under a separate owner role.

## Tests

`apps/dapp/src/lib/pools/store.integration.test.ts` runs against a real Postgres, but only when `INTEGRATION_DATABASE_URL` is set and points at localhost. It deliberately ignores `DATABASE_URL`, so a production URL in the environment can never make the suite write to a real database. CI sets it to its throwaway service container.

```bash
INTEGRATION_DATABASE_URL=postgresql://postgres:postgres@localhost:5434/aquastock \
  pnpm --filter dapp exec vitest run src/lib/pools/store.integration.test.ts
```
