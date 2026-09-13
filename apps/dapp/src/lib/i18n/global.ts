import { routing } from '@/lib/i18n/routing';
import type { LocaleMessages } from '@aquastock/locales';

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: LocaleMessages;
  }
}
