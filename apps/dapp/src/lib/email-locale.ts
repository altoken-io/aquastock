/**
 * Resolves which locale a transactional email should render in from an
 * `Accept-Language` header. Defaults to English for anything else
 * (missing header, unsupported language, malformed value).
 */
export function resolveEmailLocale(
  acceptLanguageHeader: string | null | undefined,
): 'en' | 'es' {
  const primary = acceptLanguageHeader?.split(',')[0]?.split('-')[0];
  return primary === 'es' ? 'es' : 'en';
}
