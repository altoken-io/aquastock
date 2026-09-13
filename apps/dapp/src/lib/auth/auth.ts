import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';

import prisma from '@aquastock/db-prisma';

import { env } from '@/lib/env/server';
import { resend } from '@/lib/resend';

const baseUrl = env('NEXT_PUBLIC_BASE_URL');

/**
 * Admin console auth only — the staff/government login for managing
 * projects and verifying milestones. Investor-facing auth stays pure
 * Solana wallet-connect; this is a separate concern (see memory:
 * better-auth-scope).
 */
export const auth = betterAuth({
  baseURL: baseUrl,
  secret: env('BETTER_AUTH_SECRET'),
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: 'AquaStock Admin <admin@aquastock.io>',
        to: user.email,
        subject: 'Reset your AquaStock admin password',
        html: `<p>Reset your AquaStock admin console password by following this link:</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      });
    },
  },
  hooks: {
    // No public sign-up: admin accounts are provisioned directly
    // (packages/db-prisma/scripts/create-admin-user.mjs), not self-registered.
    // This blocks the endpoint server-side, not just the UI route.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-up/email') {
        throw new APIError('FORBIDDEN', {
          message:
            'Self-service registration is disabled for the AquaStock admin console. Contact an administrator.',
        });
      }
    }),
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
