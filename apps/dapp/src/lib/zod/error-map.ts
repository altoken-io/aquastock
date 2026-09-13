// lib/validation/zodErrorMap.ts
import type { z } from 'zod';

const KNOWN_FORMATS = new Set([
  'regex',
  'email',
  'url',
  'emoji',
  'uuid',
  'uuidv4',
  'uuidv6',
  'nanoid',
  'guid',
  'cuid',
  'cuid2',
  'ulid',
  'xid',
  'ksuid',
  'datetime',
  'date',
  'time',
  'duration',
  'ipv4',
  'ipv6',
  'mac',
  'cidrv4',
  'cidrv6',
  'base64',
  'base64url',
  'json_string',
  'e164',
  'jwt',
  'template_literal',
  'starts_with',
  'ends_with',
  'includes',
]);

export function makeFormErrorMap(t: unknown): z.core.$ZodErrorMap {
  const translate = (key: string, values?: Record<string, unknown>) =>
    (t as (k: string, v?: Record<string, unknown>) => string)(key, values);
  return (issue: z.core.$ZodRawIssue) => {
    const path = issue.path?.length
      ? issue.path.map((segment) => String(segment)).join('.')
      : '';
    const fieldKey = path ? `forms.fields.${path}` : 'forms.fields._default';
    const field = translate(fieldKey);

    const withField = (key: string, values?: Record<string, unknown>) => ({
      message: translate(`forms.errors.${key}`, { field, ...values }),
    });

    const unitForOrigin = (origin?: string) => {
      switch (origin) {
        case 'string':
          return ' characters';
        case 'array':
        case 'set':
          return ' items';
        case 'file':
          return ' bytes';
        case 'map':
          return ' entries';
        default:
          return '';
      }
    };

    switch (issue.code) {
      case 'invalid_type': {
        const isRequired = issue.input === undefined || issue.input === null;
        if (isRequired) return withField('required');
        return withField('invalidType', { expected: issue.expected });
      }

      case 'invalid_value': {
        const values = issue.values.map((value) => String(value)).join(', ');
        return withField('invalidValue', { values });
      }

      case 'too_small': {
        const unit = unitForOrigin(issue.origin);
        const minimum = String(issue.minimum);
        if (issue.exact) {
          return withField('tooSmall.exact', { min: minimum, unit });
        }
        if (issue.inclusive === false) {
          return withField('tooSmall.exclusive', { min: minimum, unit });
        }
        return withField('tooSmall.inclusive', { min: minimum, unit });
      }

      case 'too_big': {
        const unit = unitForOrigin(issue.origin);
        const maximum = String(issue.maximum);
        if (issue.exact) {
          return withField('tooBig.exact', { max: maximum, unit });
        }
        if (issue.inclusive === false) {
          return withField('tooBig.exclusive', { max: maximum, unit });
        }
        return withField('tooBig.inclusive', { max: maximum, unit });
      }

      case 'invalid_format': {
        const formatIssue = issue as z.core.$ZodStringFormatIssues;
        const format = formatIssue.format;

        if (format === 'starts_with') {
          return withField('invalidFormat.starts_with', {
            prefix: formatIssue.prefix,
          });
        }
        if (format === 'ends_with') {
          return withField('invalidFormat.ends_with', {
            suffix: formatIssue.suffix,
          });
        }
        if (format === 'includes') {
          return withField('invalidFormat.includes', {
            includes: formatIssue.includes,
          });
        }
        if (format === 'regex') {
          return withField('invalidFormat.regex', {
            pattern: formatIssue.pattern,
          });
        }
        if (format === 'jwt') {
          return withField('invalidFormat.jwt', {
            algorithm: formatIssue.algorithm ?? 'unknown',
          });
        }

        if (KNOWN_FORMATS.has(format)) {
          return withField(`invalidFormat.${format}`, { format });
        }

        return withField('invalidFormat.default', { format });
      }

      case 'not_multiple_of':
        return withField('notMultipleOf', { divisor: issue.divisor });

      case 'unrecognized_keys':
        return withField('unrecognizedKeys', { keys: issue.keys.join(', ') });

      case 'invalid_union':
        return withField('invalidUnion');

      case 'invalid_key':
        return withField('invalidKey', { origin: issue.origin });

      case 'invalid_element':
        return withField('invalidElement', { origin: issue.origin });

      case 'custom':
        return issue.message ? { message: issue.message } : withField('custom');

      default:
        return withField('invalid');
    }
  };
}
