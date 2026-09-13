import type { MetadataRoute } from 'next';

import { routing } from '@/lib/i18n/routing';

const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL
    : 'https://aquastock.io';

const STATIC_PATHS = [
  '',
  '/join',
  '/waitlist',
  '/pricing',
  '/terms',
  '/privacy',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  return STATIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((altLocale) => [
            altLocale,
            `${baseUrl}/${altLocale}${path}`,
          ]),
        ),
      },
    })),
  );
}
