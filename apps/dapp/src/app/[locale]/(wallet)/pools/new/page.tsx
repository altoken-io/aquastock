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
import { CreatePoolWizard } from '@/modules/pools/components/create-pool-wizard';
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
  const t = await getTranslations({ locale, namespace: 'create.meta' });
  return { title: t('title'), description: t('description') };
}

async function WizardData() {
  let deployment = null;
  try {
    deployment = await getDeployment(getPoolServices());
  } catch {
    // The browser reads the deployment again and shows what it can.
  }
  return (
    <TokenProvider initial={deployment ?? undefined}>
      <CreatePoolWizard serverNow={unixNow()} />
    </TokenProvider>
  );
}

export default async function CreatePoolPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <PublicShell locale={locale}>
      <section>
        <div className="container py-8 sm:py-12">
          <Suspense fallback={null}>
            <WizardData />
          </Suspense>
        </div>
      </section>
    </PublicShell>
  );
}
