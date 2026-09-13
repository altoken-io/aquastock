import { routing } from '@/lib/i18n/routing';

// `router.push`/`replace` from `@/lib/i18n/navigation` already prefix
// whatever href they're given with the active locale. A path sourced from
// outside — e.g. the `redirectTo` query param proxy.ts sets from the full
// request pathname — already has a locale segment, so passing it straight
// through double-prefixes it (/en/en/...). Strip that segment first.
//
// Kept out of navigation.ts (re-exported from there) because that module
// pulls in next-intl's client `createNavigation`, which vitest/jsdom in this
// repo can't currently resolve — this needs to stay independently testable.
export function stripLocalePrefix(path: string): string {
  const [, maybeLocale, ...rest] = path.split('/');
  return routing.locales.includes(
    maybeLocale as (typeof routing.locales)[number],
  )
    ? `/${rest.join('/')}`
    : path;
}
