// Loads .env.prod with dotenv (not the shell) so values containing shell
// metacharacters — e.g. a Neon connection string's `?sslmode=require&...`
// query string — don't get mangled by `source`, then runs
// `prisma migrate deploy` with that environment. Intentionally a script the
// person holding .env.prod runs themselves, not something wired for an
// agent to invoke.
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(packageRoot, '.env.prod');

const result = config({ path: envPath });
if (result.error) {
  console.error(`Could not load ${envPath}: ${result.error.message}`);
  process.exit(1);
}

const child = spawnSync('prisma', ['migrate', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
  cwd: packageRoot,
});

if (child.error) {
  console.error(child.error.message);
  process.exit(1);
}

process.exit(child.status ?? 1);
