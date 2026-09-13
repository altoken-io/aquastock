import type { ReactNode } from 'react';

import { TooltipProvider } from '@aquastock/ui/tw/tooltip';

import { AppProviders } from '@/providers';
import { MotionProvider } from '@/providers/motion-provider';
import { PHProvider } from '@/providers/posthog-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToasterProvider } from '@/providers/toast-provider';
import { TRPCReactProvider } from '@/providers/trpc-provider';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import type { Metadata, Viewport } from 'next';
import { Geist, Plus_Jakarta_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';

import { UpdateChecker } from '@/components/helpers/update-checker';
import CookieBanner from '@/modules/miscellaneous/components/cookie-banner';
import { routing } from '@/lib/i18n/routing';
import './globals.css';

const _geist = Geist({ subsets: ['latin'] });
// Display face for wallet balances/amounts only (docs/VISUAL.md). Geist
// remains the body default; this is exposed as the `font-display` Tailwind
// utility via --font-plus-jakarta in globals.css.
const _plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['500', '600', '700', '800'],
});

type LayoutMetadataProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: LayoutMetadataProps): Promise<Metadata> => {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;

  const t = await getTranslations({ locale, namespace: 'metadata' });
  const appUrl = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL
    : 'https://app.aquastock.io';
  const siteUrl = 'https://aquastock.io';

  return {
    title: {
      default: t('title.default'),
      template: t('title.template'),
    },
    abstract: t('abstract'),
    description: t('description'),
    keywords: t.raw('keywords'),
    metadataBase: new URL(appUrl),
    applicationName: 'AquaStock dApp',
    authors: [{ name: 'AquaStock', url: siteUrl }],
    openGraph: {
      type: 'website',
      locale: t('openGraph.locale'),
      url: appUrl,
      title: t('openGraph.title'),
      description: t('openGraph.description'),
      siteName: t('openGraph.siteName'),
      images: [
        {
          url: t('openGraph.images.url'),
          width: 1731,
          height: 909,
          alt: t('openGraph.images.alt'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: t('twitter.site'),
      creator: t('twitter.creator'),
      title: t('twitter.title'),
      description: t('twitter.description'),
      images: [t('openGraph.images.url')],
    },
    icons: {
      icon: '/assets/favicon/favicon.ico',
      shortcut: '/assets/favicon/favicon.ico',
      apple: '/assets/favicon/apple-touch-icon.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'AquaStock',
    },
  };
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning translate="no">
      <body
        className={`relative bg-background text-foreground antialiased ${_geist.className} ${_plusJakarta.variable}`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <ToasterProvider>
              <TRPCReactProvider>
                <PHProvider>
                  <MotionProvider>
                    <TooltipProvider>
                      <AppProviders>
                        <CookieBanner />
                        <UpdateChecker />
                        {children}
                      </AppProviders>
                    </TooltipProvider>
                  </MotionProvider>
                </PHProvider>
              </TRPCReactProvider>
            </ToasterProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf7f3' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1714' },
  ],
};
