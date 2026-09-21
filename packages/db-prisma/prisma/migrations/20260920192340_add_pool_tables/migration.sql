-- CreateEnum
CREATE TYPE "PoolActivityKind" AS ENUM ('POOL_CREATED', 'MATCH_FUNDED', 'DEPOSITED', 'CLAIMED', 'WITHDRAWN', 'UNMATCHED_RECLAIMED', 'POSITION_CLOSED');

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "onchainAddress" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "sponsorWallet" TEXT NOT NULL,
    "poolId" DECIMAL(20,0) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolActivity" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "kind" "PoolActivityKind" NOT NULL,
    "wallet" TEXT NOT NULL,
    "amount" DECIMAL(20,0),
    "matchAmount" DECIMAL(20,0),
    "txSignature" TEXT NOT NULL,
    "eventIndex" INTEGER NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pool_onchainAddress_key" ON "Pool"("onchainAddress");

-- CreateIndex
CREATE INDEX "Pool_programId_createdAt_idx" ON "Pool"("programId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Pool_sponsorWallet_idx" ON "Pool"("sponsorWallet");

-- CreateIndex
CREATE INDEX "PoolActivity_poolId_occurredAt_id_idx" ON "PoolActivity"("poolId", "occurredAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "PoolActivity_wallet_idx" ON "PoolActivity"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "PoolActivity_txSignature_eventIndex_key" ON "PoolActivity"("txSignature", "eventIndex");

-- AddForeignKey
ALTER TABLE "PoolActivity" ADD CONSTRAINT "PoolActivity_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Defence in depth behind the server's zod validation: bounds that no legitimate row can
-- violate. Prisma does not model CHECK constraints, so they live only in this migration.
-- Solana addresses are base58 of 32 bytes (32-44 chars); signatures are 64 bytes (~87-88).
ALTER TABLE "Pool"
  ADD CONSTRAINT "Pool_name_length_check" CHECK (char_length("name") BETWEEN 1 AND 80),
  ADD CONSTRAINT "Pool_description_length_check" CHECK ("description" IS NULL OR char_length("description") <= 500),
  ADD CONSTRAINT "Pool_poolId_range_check" CHECK ("poolId" >= 0 AND "poolId" <= 18446744073709551615),
  ADD CONSTRAINT "Pool_onchainAddress_base58_check" CHECK ("onchainAddress" ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
  ADD CONSTRAINT "Pool_programId_base58_check" CHECK ("programId" ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
  ADD CONSTRAINT "Pool_sponsorWallet_base58_check" CHECK ("sponsorWallet" ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$');

ALTER TABLE "PoolActivity"
  ADD CONSTRAINT "PoolActivity_wallet_base58_check" CHECK ("wallet" ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
  ADD CONSTRAINT "PoolActivity_txSignature_base58_check" CHECK ("txSignature" ~ '^[1-9A-HJ-NP-Za-km-z]{64,90}$'),
  ADD CONSTRAINT "PoolActivity_amount_range_check" CHECK ("amount" IS NULL OR ("amount" >= 0 AND "amount" <= 18446744073709551615)),
  ADD CONSTRAINT "PoolActivity_matchAmount_range_check" CHECK ("matchAmount" IS NULL OR ("matchAmount" >= 0 AND "matchAmount" <= 18446744073709551615)),
  ADD CONSTRAINT "PoolActivity_eventIndex_check" CHECK ("eventIndex" >= 0);
