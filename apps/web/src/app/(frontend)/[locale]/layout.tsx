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
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { hasLocale } from 'next-intl';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import CookieBanner from '@/modules/miscellaneous/components/cookie-banner';
import { LanguageSwitcher } from '@/components/helpers/language-switcher';

import { routing } from '@/lib/i18n/routing';

import Footer from '@/modules/app/components/footer';
import Header from '@/modules/app/components/header';
import '../../globals.css';
import '../../animations.css';

import ThemeSwitcher from '@/components/helpers/theme-switcher';
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

const plus_jakarta_sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '600', '700', '800'],
  variable: '--font-headline',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
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
      images: [
        {
          url: t('openGraph.images.url'),
          width: 1731,
          height: 909,
          alt: t('openGraph.images.alt'),
        },
      ],
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
      images: [t('openGraph.images.url')],
    },
    category: t('category'),
    classification: t('classification'),
    applicationName: 'AquaStock',
    creator: 'AquaStock',
    publisher: 'AquaStock',
    icons: {
      icon: '/assets/favicon/favicon.ico',
      shortcut: '/assets/favicon/favicon.ico',
      apple: '/assets/favicon/apple-touch-icon.png',
    },
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
      className={`${plus_jakarta_sans.variable} ${inter.variable} light`}
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
                      <ThemeSwitcher wrapperClassName="fixed bottom-4 right-4 z-50" />
                      <LanguageSwitcher className="fixed bottom-4 left-4 z-50" />
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
              logo: `${baseUrl}/assets/favicon/android-chrome-512x512.png`,
              description:
                'AquaStock is a digital wallet for sending, receiving, and accepting payments across Peru and Latin America.',
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
    { media: '(prefers-color-scheme: light)', color: '#fce8eb' },
    { media: '(prefers-color-scheme: dark)', color: '#220309' },
  ],
};
