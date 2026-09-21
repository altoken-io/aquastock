-- SAFETY GUARD (hand-written): refuse to drop tables that hold data. The old water-funding
-- model was never wired to a route, so these tables should only ever hold seed rows. If this
-- aborts on an environment you care about, export the rows first, empty the tables, then
-- `prisma migrate resolve --rolled-back <this migration>` and deploy again.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Project")
    OR EXISTS (SELECT 1 FROM "Position")
    OR EXISTS (SELECT 1 FROM "Milestone")
    OR EXISTS (SELECT 1 FROM "Impact") THEN
    RAISE EXCEPTION 'drop_water_funding_tables: the old water-funding tables hold rows; back them up and empty them first';
  END IF;
END $$;

/*
  Warnings:

  - You are about to drop the `Impact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Milestone` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Impact" DROP CONSTRAINT "Impact_milestoneId_fkey";

-- DropForeignKey
ALTER TABLE "Impact" DROP CONSTRAINT "Impact_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Milestone" DROP CONSTRAINT "Milestone_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Position" DROP CONSTRAINT "Position_projectId_fkey";

-- DropTable
DROP TABLE "Impact";

-- DropTable
DROP TABLE "Milestone";

-- DropTable
DROP TABLE "Position";

-- DropTable
DROP TABLE "Project";

-- DropEnum
DROP TYPE "InvestorType";

-- DropEnum
DROP TYPE "MilestoneStatus";

-- DropEnum
DROP TYPE "ProjectStatus";
