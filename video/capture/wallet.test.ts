import assert from 'node:assert/strict';
import { randomBytes, verify } from 'node:crypto';
import { test } from 'node:test';

import { base58, newWallet, signTransaction } from './wallet.ts';

test('base58 matches known encodings', () => {
  // The system program's address is 32 zero bytes.
  assert.equal(base58(new Uint8Array(32)), '1'.repeat(32));
  assert.equal(base58(Buffer.from('Hello World!')), '2NEpo7TZRRrLZSi2U');
  assert.equal(base58(Uint8Array.from([0, 0, 1])), '112');
});

/** A minimal wire transaction: `signers` required signers, then one other key, no instructions. */
function transaction(signers: Uint8Array[], versioned: boolean) {
  const keys = [...signers, randomBytes(32)];
  const message = Buffer.concat([
    Buffer.from(versioned ? [0x80] : []),
    Buffer.from([signers.length, 0, 1, keys.length]),
    ...keys,
    randomBytes(32), // blockhash
    Buffer.from(versioned ? [0, 0] : [0]),
  ]);
  const wire = Buffer.concat([
    Buffer.from([signers.length]),
    Buffer.alloc(64 * signers.length),
    message,
  ]);
  return { wire, message };
}

for (const versioned of [false, true]) {
  test(`signs its own slot in a ${versioned ? 'v0' : 'legacy'} transaction`, () => {
    const payer = newWallet();
    const wallet = newWallet();
    const { wire, message } = transaction(
      [payer.publicKey, wallet.publicKey],
      versioned,
    );
    const signed = signTransaction(wallet, wire);

    // The payer's slot is untouched; ours holds a signature over the message.
    assert.deepEqual(Buffer.from(signed.subarray(1, 65)), Buffer.alloc(64));
    const signature = signed.subarray(65, 129);
    assert.ok(
      verify(null, message, { key: wallet.jwk, format: 'jwk' }, signature),
    );
    // Nothing else changes.
    assert.deepEqual(
      Buffer.from(signed.subarray(129)),
      Buffer.from(wire.subarray(129)),
    );
  });
}

test('refuses a transaction it is not a signer of', () => {
  const stranger = newWallet();
  const { wire } = transaction([newWallet().publicKey], false);
  assert.throws(() => signTransaction(stranger, wire), /not a signer/);
});

test('refuses a truncated transaction', () => {
  assert.throws(() => signTransaction(newWallet(), Uint8Array.from([0x80])));
});
