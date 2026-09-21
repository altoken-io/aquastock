// @vitest-environment node
import { createPrivateKey, randomBytes, sign } from 'node:crypto';

import { Keypair } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import {
  MAX_CLOCK_SKEW_SECONDS,
  MAX_SIGNATURE_AGE_SECONDS,
  buildMetadataMessage,
  isFresh,
  verifyEd25519,
} from './signed-message';

// DER prefix that wraps a 32-byte Ed25519 seed as a PKCS#8 private key.
const PKCS8_ED25519_PREFIX = Buffer.from(
  '302e020100300506032b657004220420',
  'hex',
);

function signWith(keypair: Keypair, message: string): Uint8Array {
  const seed = keypair.secretKey.slice(0, 32);
  const key = createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, seed]),
    format: 'der',
    type: 'pkcs8',
  });
  return sign(null, Buffer.from(message), key);
}

const fields = {
  programId: '92EVZikCaJ1SXTJAq7e8NzzZg5zLKjK2LyX14SQeQRfE',
  pool: 'Pool11111111111111111111111111111111111111',
  name: 'Contractor match',
  description: 'Line one\nLine two',
  issuedAt: 1_800_000_000,
};

describe('buildMetadataMessage', () => {
  it('is deterministic and binds every field', () => {
    const base = buildMetadataMessage(fields);
    expect(buildMetadataMessage({ ...fields })).toBe(base);
    for (const change of [
      { programId: 'other' },
      { pool: 'other' },
      { name: 'other' },
      { description: 'other' },
      { description: null },
      { issuedAt: fields.issuedAt + 1 },
    ]) {
      expect(buildMetadataMessage({ ...fields, ...change })).not.toBe(base);
    }
  });

  it('cannot be confused by a description that imitates the message layout', () => {
    const forged = buildMetadataMessage({
      ...fields,
      description: 'x","issuedAt":1}\n{"pool":"attacker',
    });
    expect(forged.split('\n').at(-1)).not.toContain('"pool":"attacker"}');
    // The JSON object is a single line, so an embedded newline is escaped, not a new field.
    expect(forged.split('\n')).toHaveLength(4);
  });
});

describe('verifyEd25519', () => {
  const wallet = Keypair.generate();
  const message = buildMetadataMessage(fields);
  const signature = signWith(wallet, message);

  it('accepts a genuine signature from the wallet', () => {
    expect(
      verifyEd25519(
        wallet.publicKey.toBytes(),
        Buffer.from(message),
        signature,
      ),
    ).toBe(true);
  });

  it('rejects a different wallet, a tampered message and a tampered signature', () => {
    const other = Keypair.generate();
    expect(
      verifyEd25519(other.publicKey.toBytes(), Buffer.from(message), signature),
    ).toBe(false);
    expect(
      verifyEd25519(
        wallet.publicKey.toBytes(),
        Buffer.from(buildMetadataMessage({ ...fields, name: 'Changed' })),
        signature,
      ),
    ).toBe(false);
    const flipped = Uint8Array.from(signature);
    flipped[0] = (flipped[0] ?? 0) ^ 1;
    expect(
      verifyEd25519(wallet.publicKey.toBytes(), Buffer.from(message), flipped),
    ).toBe(false);
  });

  it('rejects malformed inputs without throwing', () => {
    expect(
      verifyEd25519(new Uint8Array(31), Buffer.from(message), signature),
    ).toBe(false);
    expect(
      verifyEd25519(
        wallet.publicKey.toBytes(),
        Buffer.from(message),
        new Uint8Array(63),
      ),
    ).toBe(false);
    expect(
      verifyEd25519(
        wallet.publicKey.toBytes(),
        Buffer.from(message),
        randomBytes(64),
      ),
    ).toBe(false);
    expect(
      verifyEd25519(new Uint8Array(32), Buffer.from(message), signature),
    ).toBe(false);
  });
});

describe('isFresh', () => {
  const now = 1_800_000_000;

  it('accepts recent and slightly-future timestamps', () => {
    expect(isFresh(now, now)).toBe(true);
    expect(isFresh(now - MAX_SIGNATURE_AGE_SECONDS, now)).toBe(true);
    expect(isFresh(now + MAX_CLOCK_SKEW_SECONDS, now)).toBe(true);
  });

  it('rejects stale and far-future timestamps', () => {
    expect(isFresh(now - MAX_SIGNATURE_AGE_SECONDS - 1, now)).toBe(false);
    expect(isFresh(now + MAX_CLOCK_SKEW_SECONDS + 1, now)).toBe(false);
  });
});
