import { describe, expect, it } from 'vitest';

import { stripLocalePrefix } from '@/lib/i18n/redirect';

// Regression guard: next-intl's router.push/replace already prefix whatever
// href they're given with the active locale, so a redirectTo value sourced
// from proxy.ts (which already includes the locale) must be stripped first
// or the final URL ends up double-prefixed (/en/en/admin/waitlist).
describe('stripLocalePrefix', () => {
  it('removes a leading locale segment', () => {
    expect(stripLocalePrefix('/en/admin/waitlist')).toBe('/admin/waitlist');
    expect(stripLocalePrefix('/es/activity')).toBe('/activity');
  });

  it('preserves the query string', () => {
    expect(stripLocalePrefix('/en/admin/waitlist?tab=pending')).toBe(
      '/admin/waitlist?tab=pending',
    );
  });

  it('leaves a bare locale root as a single slash', () => {
    expect(stripLocalePrefix('/en')).toBe('/');
  });

  it('leaves paths with no locale segment unchanged', () => {
    expect(stripLocalePrefix('/admin/waitlist')).toBe('/admin/waitlist');
  });

  it('does not strip a path segment that only resembles a locale', () => {
    expect(stripLocalePrefix('/entities/list')).toBe('/entities/list');
  });
});
