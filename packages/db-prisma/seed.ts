import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

import {
  InvestorType,
  MilestoneStatus,
  PrismaClient,
} from './prisma/client/generated';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// Minimal demo data for the AquaStock hackathon walkthrough: one water
// project with a government (public) and community (private) position, and
// a milestone timeline. Real project data comes from the team's own inputs.
async function main() {
  const project = await prisma.project.upsert({
    where: { slug: 'demo-water-project' },
    update: {},
    create: {
      slug: 'demo-water-project',
      name: 'Demo Water Access Project',
      description: 'Seed project used for local development and demos.',
      location: 'Peru',
      goalAmount: 100_000,
      status: 'ACTIVE',
      positions: {
        create: [
          {
            investorType: InvestorType.PUBLIC,
            walletAddress: '11111111111111111111111111111111',
            amount: 60_000,
          },
          {
            investorType: InvestorType.PRIVATE,
            walletAddress: '22222222222222222222222222222222',
            amount: 15_000,
          },
        ],
      },
      milestones: {
        create: [
          {
            title: 'Site survey complete',
            order: 1,
            status: MilestoneStatus.VERIFIED,
            verifiedAt: new Date(),
          },
          { title: 'Pipeline installation', order: 2 },
          { title: 'Water quality certification', order: 3 },
        ],
      },
    },
  });

  console.log(`Seeded project: ${project.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
