import * as locales from '@aquastock/locales';
import { Locale, hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from '@/lib/i18n/routing';

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const candidate = locale ?? (await requestLocale);

  const resolved = hasLocale(routing.locales, candidate)
    ? candidate!
    : routing.defaultLocale;

  return {
    locale: resolved,
    messages: locales[resolved as Locale],
  };
});
