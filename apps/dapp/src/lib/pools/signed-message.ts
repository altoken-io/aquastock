// Wallet-signed writes. Savers and sponsors have no accounts, so a sponsor proves who
// they are by signing a message with the wallet that owns the pool on-chain. The server
// rebuilds the message from the request fields, so a signature cannot be replayed for a
// different pool, program, name or description.
import { createPublicKey, verify } from 'node:crypto';

// DER prefix that wraps a raw 32-byte Ed25519 key as an SPKI public key.
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export const MAX_SIGNATURE_AGE_SECONDS = 600;
export const MAX_CLOCK_SKEW_SECONDS = 120;

// The text a wallet signs lives in `metadata-message.ts`, which the browser also imports (this
// file needs node:crypto).
export {
  buildMetadataMessage,
  type MetadataMessageFields,
} from './metadata-message';

export function verifyEd25519(
  publicKey: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array,
): boolean {
  if (publicKey.length !== 32 || signature.length !== 64) return false;
  try {
    const key = createPublicKey({
      key: Buffer.concat([SPKI_ED25519_PREFIX, publicKey]),
      format: 'der',
      type: 'spki',
    });
    return verify(null, message, key, signature);
  } catch {
    return false;
  }
}

/** Signed messages are only good for a few minutes, and never from the future. */
export function isFresh(issuedAt: number, now: number): boolean {
  return (
    issuedAt <= now + MAX_CLOCK_SKEW_SECONDS &&
    now - issuedAt <= MAX_SIGNATURE_AGE_SECONDS
  );
}
