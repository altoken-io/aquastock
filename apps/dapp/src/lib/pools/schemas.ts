// Validation for every untrusted input at the API boundary. Nothing downstream re-checks
// the shapes, so anything a route accepts must have passed through here.
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
// Any control character except tab and newline (descriptions may span lines).
const CONTROL_EXCEPT_WHITESPACE = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/;

export function isValidAddress(value: string): boolean {
  if (value.length < 32 || value.length > 44 || !BASE58.test(value)) {
    return false;
  }
  try {
    // Round trip rejects non-canonical encodings that decode to the same key.
    return new PublicKey(value).toBase58() === value;
  } catch {
    return false;
  }
}

export const addressSchema = z
  .string()
  .trim()
  .refine(isValidAddress, 'must be a valid Solana address');

/** A transaction signature: base58 of 64 bytes, 87 or 88 characters in practice. */
export const txSignatureSchema = z
  .string()
  .trim()
  .min(64)
  .max(90)
  .regex(BASE58, 'must be a base58 transaction signature');

const plainText = (label: string, min: number, max: number) =>
  z
    .string()
    .transform((value) => value.normalize('NFC').trim())
    .pipe(
      z
        .string()
        .min(min, `${label} is required`)
        .max(max, `${label} must be at most ${max} characters`)
        .refine(
          (value) => !CONTROL_EXCEPT_WHITESPACE.test(value),
          `${label} contains characters that are not allowed`,
        ),
    );

export const poolNameSchema = plainText('name', 1, 80).refine(
  (value) => !/[\n\t]/.test(value),
  'name must be a single line',
);

/** Blank becomes null, so an empty field clears the description. */
export const poolDescriptionSchema = z
  .string()
  .max(2_000)
  .transform((value) => value.normalize('NFC').trim())
  .pipe(
    z
      .string()
      .max(500, 'description must be at most 500 characters')
      .refine(
        (value) => !CONTROL_EXCEPT_WHITESPACE.test(value),
        'description contains characters that are not allowed',
      ),
  )
  .transform((value) => (value === '' ? null : value));

const unixSeconds = z.number().int().min(0).max(4_102_444_800);

/** 64 signature bytes in canonical base64. */
export const signatureBase64Schema = z
  .string()
  .length(88)
  .regex(/^[A-Za-z0-9+/]{86}==$/, 'must be a base64 ed25519 signature')
  .refine((value) => {
    const bytes = Buffer.from(value, 'base64');
    return bytes.length === 64 && bytes.toString('base64') === value;
  }, 'must be a base64 ed25519 signature');

export const listPoolsQuerySchema = z.object({
  sponsor: addressSchema.optional(),
  status: z.enum(['open', 'ended', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const walletQuerySchema = z.object({ wallet: addressSchema });

export const poolDetailQuerySchema = z.object({
  wallet: addressSchema.optional(),
});

export const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(200).optional(),
});

export const faucetBodySchema = z.object({ wallet: addressSchema }).strict();

export const recordActivityBodySchema = z
  .object({ signature: txSignatureSchema })
  .strict();

export const saveMetadataBodySchema = z
  .object({
    name: poolNameSchema,
    // `.default()` would skip the blank-to-null transform, so map absence explicitly.
    description: poolDescriptionSchema
      .optional()
      .transform((value) => value ?? null),
    issuedAt: unixSeconds,
    signature: signatureBase64Schema,
  })
  .strict();

export type SaveMetadataBody = z.infer<typeof saveMetadataBodySchema>;

/** A keyset cursor: the sort key of the last row a client saw. */
const cursorSchema = z.object({
  t: z.string().datetime({ offset: true }),
  id: z.string().min(1).max(64),
});

export type ActivityCursor = z.infer<typeof cursorSchema>;

export function encodeCursor(cursor: ActivityCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

/** Returns null for anything that is not a cursor this server issued. */
export function decodeCursor(value: string): ActivityCursor | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );
    const result = cursorSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
