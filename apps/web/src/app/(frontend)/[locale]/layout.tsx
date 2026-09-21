import type { ReactNode } from 'react';

import { MotionProvider } from '@/providers/motion-provider';
import { PHProvider } from '@/providers/posthog-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToasterProvider } from '@/providers/toast-provider';
import { TRPCReactProvider } from '@/providers/trpc-provider';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { hasLocale } from 'next-intl';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import CookieBanner from '@/modules/miscellaneous/components/cookie-banner';

import { routing } from '@/lib/i18n/routing';

import Footer from '@/modules/app/components/footer';
import Header from '@/modules/app/components/header';
import '../../globals.css';
import '../../animations.css';

import { Toaster } from 'sonner';

function getBrowserPreferredLocale(
  // Función para detectar el idioma preferido del navegador
  acceptLanguageHeader: string,
  availableLocales: readonly string[],
): string {
  if (!acceptLanguageHeader) return availableLocales[0];

  const languages = acceptLanguageHeader
    .split(',')
    .map((lang) => {
      const [code, q = 'q=1'] = lang.split(';');
      return {
        code: code.trim().split('-')[0].toLowerCase(),
        quality: parseFloat(q.replace('q=', '')),
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const lang of languages) {
    const matching = availableLocales.find(
      (locale) => locale.toLowerCase() === lang.code,
    );
    if (matching) return matching;
  }

  return availableLocales[0]; // fallback al locale por defecto
}

// Type system for the marketing site's "civic instrument" direction (see
// docs/VISUAL.md for the shared color tokens this pairs with): Space Grotesk
// carries headline personality with technical, well-drawn numerals; IBM Plex
// Sans is the quieter civic/engineering-register body face; IBM Plex Mono
// renders the gauge rail's datum labels, ledger numerals, and benchmark
// stamps. apps/dapp keeps its own separate Geist-based system — these are
// deliberately not shared, see docs/COMPONENTS.md.
const space_grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-headline',
  display: 'swap',
});

const ibm_plex_sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const ibm_plex_mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

type LocaleParams = Promise<{
  locale: string;
}>;

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: LocaleParams;
}>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const generateMetadata = async ({
  params,
}: Pick<LocaleLayoutProps, 'params'>): Promise<Metadata> => {
  const { locale } = await params;
  const resolvedLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'metadata',
  });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL
    : 'https://aquastock.io';
  const canonicalUrl = `${baseUrl}/${resolvedLocale}`;

  return {
    title: {
      default: t('title.default'),
      template: t('title.template'),
    },
    abstract: t('abstract'),
    description: t('description'),
    keywords: t.raw('keywords'),
    generator: 'Next.js',
    authors: [
      {
        name: 'AquaStock',
        url: baseUrl,
      },
    ],
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${baseUrl}/en`,
        es: `${baseUrl}/es`,
      },
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    appLinks: {
      web: {
        url: baseUrl,
      },
    },
    openGraph: {
      type: 'website',
      locale: t('openGraph.locale'),
      url: canonicalUrl,
      title: t('openGraph.title'),
      siteName: t('openGraph.siteName'),
      description: t('openGraph.description'),
    },
    twitter: {
      card: 'summary_large_image',
      site: t('twitter.site'),
      creator: t('twitter.creator'),
      title: t('twitter.title'),
      description: t('twitter.description'),
    },
    category: t('category'),
    classification: t('classification'),
    applicationName: 'AquaStock',
    creator: 'AquaStock',
    publisher: 'AquaStock',
    appleWebApp: {
      title: 'AquaStock',
      statusBarStyle: 'default',
      capable: true,
    },
  };
};

export default async function RootLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL
    : 'https://aquastock.io';

  if (!hasLocale(routing.locales, locale)) {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language') || '';
    const preferredLocale = getBrowserPreferredLocale(
      acceptLanguage,
      routing.locales,
    );
    redirect(`/${preferredLocale}`);
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Preload messages for the current locale
  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      className={`${space_grotesk.variable} ${ibm_plex_sans.variable} ${ibm_plex_mono.variable} light`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <ToasterProvider>
              <TRPCReactProvider>
                <PHProvider>
                  <QueryProvider>
                    <MotionProvider>
                      <Header />
                      <main id="main-content">{children}</main>
                      <Footer />
                      <CookieBanner />
                    </MotionProvider>
                  </QueryProvider>
                </PHProvider>
              </TRPCReactProvider>
            </ToasterProvider>
          </ThemeProvider>
        </NextIntlClientProvider>

        {/* Analytics */}
        <Analytics />
        <SpeedInsights />
        <Toaster />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'AquaStock',
              url: baseUrl,
              logo: `${baseUrl}/icon.svg`,
              description:
                "AquaStock lets a sponsor fund a match on savers' deposits of tokenized SPYx. The match vests on-chain; leave early and keep your deposit and what has vested.",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'AquaStock',
              url: baseUrl,
            }),
          }}
        />
      </body>
    </html>
  );
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 0.95,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1c' },
  ],
};
