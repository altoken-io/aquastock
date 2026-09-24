import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import { AuthShell } from '@/components/auth-shell';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { SignInForm } from '@/modules/auth/components/sign-in-form';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: t('signIn.title') };
}

// The dApp's home route is the login page — marketing/pitch content lives
// only in apps/web (see memory: dapp-home-is-login). Staff/government admin
// console sign-in — see memory: better-auth-scope. No public sign-up:
// accounts are provisioned via packages/db-prisma/scripts/create-admin-user.mjs.
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });

  return (
    <AuthShell
      locale={locale}
      title={t('signIn.title')}
      subtitle={t('signIn.subtitle')}
    >
      <SignInForm />
      {/* Savers and sponsors never sign in; anyone who lands on the bare app URL needs a way on. */}
      <p className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
        {t('signIn.notStaff')}{' '}
        <Link
          href="/pools"
          className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('signIn.openPools')}
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </p>
    </AuthShell>
  );
}
