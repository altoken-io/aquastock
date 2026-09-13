// Creates an apps/dapp admin-console account directly — there is no public
// sign-up route (see memory: better-auth-scope). Builds its own minimal
// Better Auth instance (no nextCookies, no hooks) purely to reuse Better
// Auth's own password hashing via the documented `auth.api.signUpEmail`
// call, so the stored hash is guaranteed compatible with the real app.
//
// Usage:
//   node scripts/create-admin-user.mjs --email you@example.com --name "Your Name" [--env .env.prod]
// Prompts for a password interactively (not passed as a CLI arg, so it
// never ends up in shell history).
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { config } from 'dotenv';

function parseArgs(argv) {
  const args = { env: '.env' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--email') args.email = argv[++i];
    else if (arg === '--name') args.name = argv[++i];
    else if (arg === '--env') args.env = argv[++i];
  }
  return args;
}

async function promptPassword() {
  const rl = createInterface({ input: stdin, output: stdout });
  const password = await rl.question('Password (min 8 chars): ');
  rl.close();
  return password;
}

async function main() {
  const { email, name, env: envPath } = parseArgs(process.argv.slice(2));

  if (!email || !name) {
    console.error(
      'Usage: node scripts/create-admin-user.mjs --email you@example.com --name "Your Name" [--env .env.prod]',
    );
    process.exit(1);
  }

  const result = config({ path: envPath });
  if (result.error) {
    console.error(`Could not load ${envPath}: ${result.error.message}`);
    process.exit(1);
  }

  const password = await promptPassword();
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  // Dynamic imports: DATABASE_URL/DIRECT_URL must be in process.env
  // *before* lib/prisma.ts's module-level code constructs the pg pool —
  // a static top-level import would evaluate before the config() call
  // above ever runs.
  const [{ betterAuth }, { prismaAdapter }, { default: prisma }] =
    await Promise.all([
      import('better-auth'),
      import('better-auth/adapters/prisma'),
      import('../lib/prisma.ts'),
    ]);

  const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET ?? 'provisioning-script-only',
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: { enabled: true },
  });

  const { error } = await auth.api.signUpEmail({
    body: { email, name, password },
  });

  if (error) {
    console.error(`Failed to create admin user: ${error.message ?? error}`);
    process.exit(1);
  }

  console.log(`Created admin account for ${email}.`);
  await prisma.$disconnect();
}

main();
