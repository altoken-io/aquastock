import { headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DappShell } from '@/components/dapp-shell';
import { routing } from '@/lib/i18n/routing';
import { redirect } from '@/lib/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { SignOutButton } from '@/modules/auth/components/sign-out-button';

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
  return { title: t('dashboard.title') };
}

// Protected placeholder proving the admin auth flow end-to-end. Real
// project/milestone management tools are separate, later work — see
// docs/ROADMAP.md. src/proxy.ts also guards this route by cookie presence;
// this server check is the actual session validation (defense in depth).
export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect({ href: '/sign-in', locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: 'admin' });

  return (
    <DappShell>
      <div className="flex flex-1 items-center justify-center">
        <div className="dapp-panel flex w-full max-w-lg flex-col gap-6 px-8 py-10 text-center sm:px-10">
          <h1 className="text-2xl text-foreground">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.signedInAs', { email: session.user.email })}
          </p>
          <p className="text-muted-foreground">{t('dashboard.placeholder')}</p>
          <div className="flex justify-center">
            <SignOutButton />
          </div>
        </div>
      </div>
    </DappShell>
  );
}
