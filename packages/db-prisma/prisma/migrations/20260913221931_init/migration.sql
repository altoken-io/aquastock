-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FUNDED', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvestorType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "goalAmount" DECIMAL(65,30) NOT NULL,
    "raisedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "onchainAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "investorType" "InvestorType" NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "txSignature" TEXT,
    "onchainAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(65,30),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "onchainAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Impact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "metric" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onchainAddress" TEXT,

    CONSTRAINT "Impact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Project_onchainAddress_key" ON "Project"("onchainAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Position_onchainAddress_key" ON "Position"("onchainAddress");

-- CreateIndex
CREATE INDEX "Position_projectId_idx" ON "Position"("projectId");

-- CreateIndex
CREATE INDEX "Position_walletAddress_idx" ON "Position"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_onchainAddress_key" ON "Milestone"("onchainAddress");

-- CreateIndex
CREATE INDEX "Milestone_projectId_idx" ON "Milestone"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Impact_onchainAddress_key" ON "Impact"("onchainAddress");

-- CreateIndex
CREATE INDEX "Impact_projectId_idx" ON "Impact"("projectId");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impact" ADD CONSTRAINT "Impact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impact" ADD CONSTRAINT "Impact_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
