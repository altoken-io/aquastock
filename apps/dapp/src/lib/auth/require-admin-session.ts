import { headers } from 'next/headers';
import type { Locale } from 'next-intl';

import { auth } from '@/lib/auth/auth';
import { redirect } from '@/lib/i18n/navigation';

/**
 * Shared guard for every /dashboard/* page: src/proxy.ts only checks cookie
 * presence (optimistic), so each server page still validates the real
 * session itself — defense in depth, per the existing dashboard page and
 * memory: better-auth-scope.
 */
export async function requireAdminSession(locale: Locale) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect({ href: '/sign-in', locale });
    throw new Error('Unreachable: redirect() interrupts rendering');
  }
  return session;
}
