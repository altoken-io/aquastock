import { Locale } from 'next-intl';

export type LocalePageProps = {
  params: Promise<{ locale: Locale }>;
};

export type DynamicPageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<DefaultSearchParams>;
};
