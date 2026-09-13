# AquaStock database

`packages/db-prisma/prisma/schema.prisma` is the off-chain cache/display layer mirroring the Solana Anchor program's account types (the program itself doesn't exist yet — see `docs/ARCHITECTURE.md`). It is not a second source of truth for money movement; once the program is deployed, on-chain state wins and these rows exist so the UI can query/paginate without an RPC call per render.

## Models

**`Project`** — `id`, `slug` (unique), `name`, `description?`, `location`, `goalAmount`, `raisedAmount` (default 0), `status` (`ProjectStatus`: `DRAFT | ACTIVE | FUNDED | COMPLETED | CLOSED`), `onchainAddress?` (unique — the project PDA once created on-chain), timestamps. Has many `Position`, `Milestone`, `Impact`.

**`Position`** — a single investor's stake in a project. `id`, `projectId`, `investorType` (`InvestorType`: `PUBLIC | PRIVATE`), `walletAddress`, `amount`, `txSignature?`, `onchainAddress?` (unique), `createdAt`. Indexed on `projectId` and `walletAddress`.

**`Milestone`** — `id`, `projectId`, `title`, `description?`, `targetAmount?`, `status` (`MilestoneStatus`: `PENDING | IN_PROGRESS | VERIFIED`), `order`, `verifiedAt?`, `onchainAddress?` (unique), timestamps. Indexed on `projectId`. Has many `Impact`.

**`Impact`** — a recorded outcome, optionally tied to a specific milestone. `id`, `projectId`, `milestoneId?`, `metric` (e.g. "households connected"), `value`, `recordedAt`, `onchainAddress?` (unique). Indexed on `projectId`.

## Access pattern

`packages/db-prisma/lib/prisma.ts` exports a process-wide `prisma` singleton built on the `@prisma/adapter-pg` driver adapter (reads `DATABASE_URL`), plus `createPrismaClient(connectionString, options?)` for the rare case of a second connection at once. `DATABASE_POOL_MAX` (default 5) caps the connection pool per process.

`packages/types/src/project.ts` has the matching TypeScript transport shapes (`Project`, `Position`, `Milestone`, `Impact`) for `apps/dapp`'s route handlers and UI to share, without depending on Prisma's generated client directly.

## Migrations

Checked-in migrations under `packages/db-prisma/prisma/migrations` are the current history (a fresh start — no DDPay-era migration history carried forward). Run `pnpm --filter @aquastock/db-prisma exec prisma migrate dev` locally; see `docs/SETUP.md`.

## Seed data

`packages/db-prisma/seed.ts` seeds one demo project (`demo-water-project`) with one public and one private position and a 3-step milestone timeline, for local development and demos. Real project data is the team's own input, not generated content.
