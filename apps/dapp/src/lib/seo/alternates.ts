type Locale = 'en' | 'es';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://aquastock.io';

export const buildLocaleAlternates = (pathname: string, locale: Locale) => {
  const normalizedPathname = pathname.startsWith('/')
    ? pathname
    : `/${pathname}`;
  const canonical = `${BASE_URL}/${locale}${normalizedPathname}`;
  const xDefault = `${BASE_URL}/en${normalizedPathname}`;

  return {
    canonical,
    languages: {
      en: `${BASE_URL}/en${normalizedPathname}`,
      es: `${BASE_URL}/es${normalizedPathname}`,
      'x-default': xDefault,
    },
  };
};
