import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = dirname(fileURLToPath(import.meta.url));

loadEnv({ path: resolve(configDir, '../../.env') });
loadEnv();

/**
 * `prisma generate` (run from this package's postinstall on every
 * `pnpm install`, including EAS Build for apps/mobile and CI) never opens a
 * connection, but Prisma's `env()` helper throws at config load when the
 * variable is absent — which failed the whole workspace install on EAS.
 * Fall back to an obviously-invalid placeholder instead: generate works, and
 * any command that actually connects (migrate, db push, studio) fails with a
 * connection error that names DIRECT_URL_UNSET.
 */
const DIRECT_URL_PLACEHOLDER =
  'postgresql://DIRECT_URL_UNSET:unset@localhost:5432/unset?schema=public';

function directUrl(): string {
  const value = process.env.DIRECT_URL?.trim();
  if (value) return value;
  if (process.env.PRISMA_CONFIG_QUIET !== 'true') {
    console.warn(
      '[db-prisma] DIRECT_URL is not set — using a placeholder so `prisma generate` can run; database commands will fail until it is configured.',
    );
  }
  return DIRECT_URL_PLACEHOLDER;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: directUrl(),
  },
});
