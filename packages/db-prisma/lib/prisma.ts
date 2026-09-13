import { PrismaClient } from '../prisma/client/generated/index.js';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// Caps this process's node-postgres pool. Measured against the live
// Supabase project 2026-08-31: max_connections=60, ~14 already held by
// Supabase-internal clients. Left unset, node-postgres defaults to 10 per
// instance, which multiplied by Cloud Run's instance count has no ceiling
// tying it back to what the database can actually hold — see
// cloudbuild.yaml's _MAX_INSTANCES for the paired cap on the other side.
const poolMax = Number(process.env.DATABASE_POOL_MAX ?? 5);

/**
 * Builds a client pointed at an arbitrary connection string, for the rare
 * caller that needs a second database at the same time (e.g. a cross-
 * environment migration script) — everything else should use the `prisma`
 * default export below. The schema's `datasource db` declares no `url`, so
 * the connection is entirely defined by this adapter, not by
 * `PrismaClientOptions.datasourceUrl` (unavailable with this generator).
 */
export function createPrismaClient(
  connectionString: string,
  options?: { poolMax?: number },
): PrismaClient {
  const adapter = new PrismaPg({
    connectionString,
    max: options?.poolMax ?? poolMax,
  });
  return new PrismaClient({ adapter });
}

const prisma =
  globalForPrisma.prisma || createPrismaClient(process.env.DATABASE_URL ?? '');

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '../prisma/client/generated/index.js';
export default prisma;
