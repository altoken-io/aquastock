import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards the en/es parity convention in packages/locales.
 *
 * This cannot be a type-level check: `LocaleMessages` in
 * packages/locales/src/index.ts is an *intersection* of the en and es shapes,
 * so a key present in only one locale silently widens the type rather than
 * failing tsc. A missing key then surfaces as a raw key string rendered to a
 * user — in production, in one language only, which is exactly the kind of
 * bug nobody notices until a customer reports it.
 *
 * The content JSON is read straight off disk rather than through the
 * `@aquastock/locales` barrel: the package ships raw TS with no tsconfig of its
 * own, so vitest cannot transform it, and the files are what actually ship
 * anyway.
 */

const CONTENT_DIR = join(
  __dirname,
  '../../../../../packages/locales/src/content',
);

/**
 * Namespaces with pre-existing drift, quarantined so this guard can protect
 * everything else. Not an endorsement — see the note in each entry.
 */
const KNOWN_DRIFT = new Set<string>([]);

type Json = { [key: string]: unknown };

function readNamespace(locale: 'en' | 'es', file: string): Json {
  return JSON.parse(
    readFileSync(join(CONTENT_DIR, locale, file), 'utf8'),
  ) as Json;
}

function listNamespaces(locale: 'en' | 'es'): string[] {
  return readdirSync(join(CONTENT_DIR, locale))
    .filter((file) => file.endsWith('.json'))
    .sort();
}

function flattenKeys(value: Json, prefix = ''): Set<string> {
  const keys = new Set<string>();
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      for (const nested of flattenKeys(child as Json, path)) keys.add(nested);
    } else {
      keys.add(path);
    }
  }
  return keys;
}

const namespaceFiles = listNamespaces('en').filter(
  (file) => !KNOWN_DRIFT.has(file),
);

describe('locale parity', () => {
  it('ships the same namespace files in both locales', () => {
    expect(listNamespaces('es')).toEqual(listNamespaces('en'));
  });

  it.each(namespaceFiles)('has identical key paths in %s', (file) => {
    const enKeys = flattenKeys(readNamespace('en', file));
    const esKeys = flattenKeys(readNamespace('es', file));

    const missingFromEs = [...enKeys].filter((key) => !esKeys.has(key)).sort();
    const missingFromEn = [...esKeys].filter((key) => !enKeys.has(key)).sort();

    expect({ missingFromEs, missingFromEn }).toEqual({
      missingFromEs: [],
      missingFromEn: [],
    });
  });
});
