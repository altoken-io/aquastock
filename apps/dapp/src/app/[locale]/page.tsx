import { Suspense } from 'react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DappShell } from '@/components/dapp-shell';
import { routing } from '@/lib/i18n/routing';

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
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('title') };
}

// Placeholder home page. The real project browsing / My Impact experience
// (Home, Project, Milestones, My Impact) is Day 1-3 work per the AquaStock
// build plan — this just keeps the shell buildable in the meantime.
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <DappShell>
      <Suspense>
        <div className="flex flex-col gap-2 py-12 text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('placeholder')}</p>
        </div>
      </Suspense>
    </DappShell>
  );
}
