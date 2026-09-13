import { describe, expect, it } from 'vitest';

import { resolveEmailLocale } from './email-locale';

describe('resolveEmailLocale', () => {
  it('picks Spanish for an es-* Accept-Language header', () => {
    expect(resolveEmailLocale('es-PE,es;q=0.9,en;q=0.8')).toBe('es');
  });

  it('picks English for an en-* Accept-Language header', () => {
    expect(resolveEmailLocale('en-US,en;q=0.9')).toBe('en');
  });

  it('defaults to English for an unsupported language', () => {
    expect(resolveEmailLocale('fr-FR,fr;q=0.9')).toBe('en');
  });

  it('defaults to English when the header is missing', () => {
    expect(resolveEmailLocale(null)).toBe('en');
    expect(resolveEmailLocale(undefined)).toBe('en');
  });

  it('defaults to English for a malformed header', () => {
    expect(resolveEmailLocale('')).toBe('en');
    expect(resolveEmailLocale(',,,')).toBe('en');
  });
});
