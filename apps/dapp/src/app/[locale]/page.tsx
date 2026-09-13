import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import BrandLogo from '@/components/helpers/brand-logo';
import ButtonLink from '@/components/ui/button-link';
import { DappShell } from '@/components/dapp-shell';
import { WEB_BASE_URL } from '@/lib/web-url';
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
// build plan — this just keeps the shell buildable and on-brand in the
// meantime, honest about what isn't built yet (apps/dapp/PRODUCT.md).
export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const tHero = await getTranslations({ locale, namespace: 'hero' });

  return (
    <DappShell>
      <div className="flex flex-1 items-center justify-center">
        <div className="dapp-panel flex w-full max-w-lg flex-col items-center gap-6 px-8 py-12 text-center sm:px-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span
              className="size-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            {tHero('usersCount')}
          </span>

          <BrandLogo alt="AquaStock" size={48} className="size-12" />

          <div>
            <h1 className="text-2xl text-foreground">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('placeholder')}</p>
          </div>

          <ButtonLink
            href={WEB_BASE_URL}
            variant="transparent"
            rounded="full"
            padding="md"
            className="text-sm"
          >
            Learn more about AquaStock
          </ButtonLink>
        </div>
      </div>
    </DappShell>
  );
}
