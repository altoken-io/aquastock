import { hasLocale } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import EditorialComingSoon from '@/modules/app/components/sections/editorial-coming-soon';
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
  const messages = await getMessages({ locale });
  const comingSoon = (messages.common as { underConstruction?: unknown })
    .underConstruction as
    { metaTitle?: string; metaDescription?: string } | undefined;

  return {
    title: comingSoon?.metaTitle ?? 'AquaStock dApp - Coming Soon',
    description:
      comingSoon?.metaDescription ??
      'The AquaStock dApp is currently under construction.',
    robots: { index: false, follow: false },
  };
}

export default async function ComingSoonPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return <EditorialComingSoon locale={locale} />;
}
