// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PROGRAM_ERROR_CODES } from './tx-errors';

const CONTENT = join(
  __dirname,
  '../../../../../../packages/locales/src/content',
);

function programCopy(locale: 'en' | 'es'): Record<string, unknown> {
  const parsed: unknown = JSON.parse(
    readFileSync(join(CONTENT, locale, 'tx.json'), 'utf8'),
  );
  const errors = (parsed as { errors?: { program?: Record<string, unknown> } })
    .errors;
  return errors?.program ?? {};
}

describe('program error copy', () => {
  for (const locale of ['en', 'es'] as const) {
    it(`${locale} has a message for every error the program can return, and no stray ones`, () => {
      const copy = programCopy(locale);
      for (const code of PROGRAM_ERROR_CODES) {
        expect(typeof copy[code], `${locale}: ${code}`).toBe('string');
        expect((copy[code] as string).length).toBeGreaterThan(10);
      }
      expect(Object.keys(copy).sort()).toEqual([...PROGRAM_ERROR_CODES].sort());
    });
  }
});
