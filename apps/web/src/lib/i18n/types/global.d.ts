// apps/web/src/lib/i18n/global.d.ts
import type { LocaleMessages } from '@aquastock/locales';

declare global {
  type IntlMessages = LocaleMessages;
}
