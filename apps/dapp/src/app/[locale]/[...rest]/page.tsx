import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { routing } from '@/lib/i18n/routing';

/**
 * Any URL under a locale that no page claims. Without this it would fall through to the
 * framework's own English 404; calling `notFound()` here renders `not-found.tsx` in the
 * visitor's language instead.
 */
export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (hasLocale(routing.locales, locale)) setRequestLocale(locale);
  notFound();
}
