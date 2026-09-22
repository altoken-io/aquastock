// Creates an apps/dapp admin-console account directly — there is no public
// sign-up route (see memory: better-auth-scope). Builds its own minimal
// Better Auth instance (no nextCookies, no hooks) purely to reuse Better
// Auth's own password hashing via the documented `auth.api.signUpEmail`
// call, so the stored hash is guaranteed compatible with the real app.
//
// Usage:
//   node scripts/create-admin-user.mjs --email you@example.com --name "Your Name" [--env .env.prod]
// Prompts for a password interactively by default (not a CLI arg, so it
// never ends up in shell history). Two non-interactive alternatives, for
// scripting or CI, neither of which puts a password on the command line:
//   --generate-password         a strong random password is generated and
//                                printed once after the account is created;
//                                nothing needs to be typed or stored ahead of time
//   --password-env SOME_VAR     reads the password from that already-set
//                                environment variable (e.g. loaded from --env)
// There is no runtime env var the app itself reads for this: Better Auth only
// ever checks the password hash this script writes to the database, so
// nothing needs adding to .env.example or Vercel for the app to work.
import { randomBytes } from 'node:crypto';
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
    else if (arg === '--generate-password') args.generatePassword = true;
    else if (arg === '--password-env') args.passwordEnv = argv[++i];
  }
  return args;
}

async function promptPassword() {
  const rl = createInterface({ input: stdin, output: stdout });
  const password = await rl.question('Password (min 8 chars): ');
  rl.close();
  return password;
}

/** 24 random bytes as base64url: 32 characters, no ambiguous padding, ~192 bits. */
function generatePassword() {
  return randomBytes(24).toString('base64url');
}

async function main() {
  const {
    email,
    name,
    env: envPath,
    generatePassword: shouldGenerate,
    passwordEnv,
  } = parseArgs(process.argv.slice(2));

  if (!email || !name || (shouldGenerate && passwordEnv)) {
    console.error(
      'Usage: node scripts/create-admin-user.mjs --email you@example.com --name "Your Name" ' +
        '[--env .env.prod] [--generate-password | --password-env SOME_VAR]',
    );
    process.exit(1);
  }

  const result = config({ path: envPath });
  if (result.error) {
    console.error(`Could not load ${envPath}: ${result.error.message}`);
    process.exit(1);
  }

  let password;
  let generated = false;
  if (shouldGenerate) {
    password = generatePassword();
    generated = true;
  } else if (passwordEnv) {
    password = process.env[passwordEnv];
    if (!password) {
      console.error(
        `${passwordEnv} is not set (checked ${envPath} and the shell).`,
      );
      process.exit(1);
    }
  } else {
    password = await promptPassword();
  }
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

  // A duplicate email (a re-run, or a typo matching an existing account) throws
  // here instead of resolving with `{ error }` — catch both shapes the same way.
  let error;
  try {
    ({ error } = await auth.api.signUpEmail({
      body: { email, name, password },
    }));
  } catch (thrown) {
    error = thrown.body ?? thrown;
  }

  if (error) {
    console.error(`Failed to create admin user: ${error.message ?? error}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`Created admin account for ${email}.`);
  if (generated) {
    console.log(
      `Password (shown once, not stored anywhere by this script): ${password}`,
    );
  }
  await prisma.$disconnect();
}

main();
