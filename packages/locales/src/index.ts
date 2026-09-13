import type { EnLocaleMessages } from './en';
import type { EsLocaleMessages } from './es';
export { en } from './en';
export { es } from './es';

export const locales = ['en', 'es'] as const;

export type SupportedLocale = (typeof locales)[number];

export type LocaleMessages = EnLocaleMessages & EsLocaleMessages;

export async function getLocale<Namespace extends keyof LocaleMessages>(
  locale: SupportedLocale,
  ns: Namespace,
): Promise<LocaleMessages[Namespace]> {
  const module = (await import(`./content/${locale}/${String(ns)}.json`)) as {
    default: LocaleMessages[Namespace];
  };
  return module.default;
}
