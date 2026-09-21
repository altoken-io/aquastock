import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PublicShell } from '@/components/public-shell';
import { routing } from '@/lib/i18n/routing';
import { unixNow } from '@/lib/pools/clock';
import { getPoolServices } from '@/lib/pools/server';
import { getDeployment } from '@/lib/pools/service';
import { MyMatchView } from '@/modules/pools/components/my-match-view';
import { TokenProvider } from '@/modules/pools/token-context';

// Reads the chain per request: never bake a build-time deployment or clock into the HTML.
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'myMatch.meta' });
  return { title: t('title'), description: t('description') };
}

async function MyMatchData() {
  let deployment = null;
  try {
    deployment = await getDeployment(getPoolServices());
  } catch {
    // The browser reads the deployment again and shows what it can.
  }
  return (
    <TokenProvider initial={deployment ?? undefined}>
      <MyMatchView serverNow={unixNow()} />
    </TokenProvider>
  );
}

export default async function MyMatchPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'myMatch' });

  return (
    <PublicShell locale={locale}>
      <section>
        <div className="container py-10 sm:py-14">
          <header className="mb-8 max-w-2xl sm:mb-10">
            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              {t('eyebrow')}
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
              {t('title')}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              {t('subtitle')}
            </p>
          </header>
          <Suspense fallback={null}>
            <MyMatchData />
          </Suspense>
        </div>
      </section>
    </PublicShell>
  );
}
