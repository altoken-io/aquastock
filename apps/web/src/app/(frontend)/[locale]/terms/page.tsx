import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';

import { routing } from '@/lib/i18n/routing';
import {
  LegalPage,
  type LegalSection,
} from '@/modules/app/components/legal/legal-page';
import { buildLocaleAlternates } from '@/lib/seo/alternates';

type TermsPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'terms' });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL
    : 'https://aquastock.io';

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    alternates: buildLocaleAlternates('/terms', locale),
    openGraph: {
      title: t('metadata.title'),
      description: t('metadata.description'),
      url: `${baseUrl}/${locale}/terms`,
    },
  };
};

/**
 * Content is a structured transcription of `docs/TERMS.md` (the
 * canonical source, en/es under `packages/locales/src/content`). Edit the
 * markdown first, then port changes into both locale JSON files.
 */
export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'terms' });

  return (
    <LegalPage
      content={{
        eyebrow: t('eyebrow'),
        title: t('title'),
        description: t('description'),
        summary: {
          effectiveLabel: t('summary.effectiveLabel'),
          effectiveValue: t('summary.effectiveValue'),
          appliesLabel: t('summary.appliesLabel'),
          appliesValue: t('summary.appliesValue'),
          statusLabel: t('summary.statusLabel'),
          statusValue: t('summary.statusValue'),
          contactLabel: t('summary.contactLabel'),
          contactValue: t('summary.contactValue'),
        },
        tocLabel: t('tocLabel'),
        sections: t.raw('sections') as LegalSection[],
        contact: {
          title: t('contact.title'),
          body: t('contact.body'),
          email: t('contact.email'),
          buttonLabel: t('contact.buttonLabel'),
        },
      }}
    />
  );
}
