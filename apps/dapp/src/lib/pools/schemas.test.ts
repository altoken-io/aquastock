// @vitest-environment node
import { Keypair } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import {
  activityQuerySchema,
  addressSchema,
  decodeCursor,
  encodeCursor,
  listPoolsQuerySchema,
  recordActivityBodySchema,
  saveMetadataBodySchema,
  txSignatureSchema,
} from './schemas';

const address = Keypair.generate().publicKey.toBase58();
const signature = Buffer.alloc(64, 7).toString('base64');
const txSig = '5'.repeat(88);

describe('addressSchema', () => {
  it('accepts real keys and trims', () => {
    expect(addressSchema.parse(address)).toBe(address);
    expect(addressSchema.parse(`  ${address} `)).toBe(address);
  });

  it('rejects everything else', () => {
    for (const bad of [
      '',
      'short',
      '0'.repeat(44),
      `${address}x`,
      // 44 base58 characters that decode to more than 32 bytes.
      'z'.repeat(44),
      `${address}; drop table "Pool";--`,
      '../../etc/passwd',
      'O'.repeat(40),
    ]) {
      expect(addressSchema.safeParse(bad).success, JSON.stringify(bad)).toBe(
        false,
      );
    }
    expect(addressSchema.safeParse(123).success).toBe(false);
    expect(addressSchema.safeParse(null).success).toBe(false);
  });
});

describe('txSignatureSchema', () => {
  it('accepts base58 signatures and rejects malformed ones', () => {
    expect(txSignatureSchema.safeParse(txSig).success).toBe(true);
    for (const bad of [
      '',
      'abc',
      '0'.repeat(88),
      `${txSig}!`,
      'x'.repeat(200),
    ]) {
      expect(txSignatureSchema.safeParse(bad).success, bad).toBe(false);
    }
  });
});

describe('listPoolsQuerySchema', () => {
  it('applies defaults and bounds', () => {
    expect(listPoolsQuerySchema.parse({})).toEqual({
      status: 'all',
      limit: 50,
    });
    expect(
      listPoolsQuerySchema.parse({ limit: '100', status: 'open' }),
    ).toEqual({ status: 'open', limit: 100 });
    expect(listPoolsQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
    expect(listPoolsQuerySchema.safeParse({ limit: '101' }).success).toBe(
      false,
    );
    expect(listPoolsQuerySchema.safeParse({ limit: '1.5' }).success).toBe(
      false,
    );
    expect(listPoolsQuerySchema.safeParse({ status: 'hacked' }).success).toBe(
      false,
    );
    expect(listPoolsQuerySchema.safeParse({ sponsor: 'nope' }).success).toBe(
      false,
    );
  });
});

describe('saveMetadataBodySchema', () => {
  const valid = {
    name: '  Contractor match ',
    description: 'Two\nlines',
    issuedAt: 1_800_000_000,
    signature,
  };

  it('normalises and trims', () => {
    expect(saveMetadataBodySchema.parse(valid)).toEqual({
      name: 'Contractor match',
      description: 'Two\nlines',
      issuedAt: 1_800_000_000,
      signature,
    });
  });

  it('turns a blank or missing description into null', () => {
    expect(
      saveMetadataBodySchema.parse({ ...valid, description: '   ' })
        .description,
    ).toBeNull();
    const { description: _omitted, ...withoutDescription } = valid;
    expect(
      saveMetadataBodySchema.parse(withoutDescription).description,
    ).toBeNull();
  });

  it('rejects bad names, control characters, oversize text and unknown keys', () => {
    const bad: Record<string, unknown>[] = [
      { name: '' },
      { name: '   ' },
      { name: 'x'.repeat(81) },
      { name: 'two\nlines' },
      { name: 'nul\u0000byte' },
      { name: 'esc\u001b[31m' },
      { description: 'x'.repeat(501) },
      { description: 'bell\u0007' },
      { issuedAt: -1 },
      { issuedAt: 1.5 },
      { issuedAt: '1800000000' },
      { signature: 'short' },
      { signature: 'A'.repeat(88) },
      { extra: 'field' },
    ];
    for (const change of bad) {
      expect(
        saveMetadataBodySchema.safeParse({ ...valid, ...change }).success,
        JSON.stringify(change),
      ).toBe(false);
    }
  });

  it('accepts Spanish text and emoji', () => {
    expect(
      saveMetadataBodySchema.safeParse({
        ...valid,
        name: 'Aporte para contratistas ñ á 🌊',
      }).success,
    ).toBe(true);
  });
});

describe('recordActivityBodySchema', () => {
  it('needs exactly a signature', () => {
    expect(
      recordActivityBodySchema.safeParse({ signature: txSig }).success,
    ).toBe(true);
    expect(recordActivityBodySchema.safeParse({}).success).toBe(false);
    expect(
      recordActivityBodySchema.safeParse({ signature: txSig, extra: 1 })
        .success,
    ).toBe(false);
  });
});

describe('activity cursor', () => {
  const cursor = { t: '2026-09-20T12:00:00.000Z', id: 'clx123' };

  it('round trips', () => {
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
    expect(
      activityQuerySchema.parse({ cursor: encodeCursor(cursor) }).limit,
    ).toBe(20);
  });

  it('rejects anything this server did not issue', () => {
    for (const bad of [
      '',
      'not-base64!!',
      Buffer.from('nope').toString('base64url'),
      Buffer.from('{"t":"x","id":1}').toString('base64url'),
      Buffer.from(JSON.stringify({ t: 'yesterday', id: 'a' })).toString(
        'base64url',
      ),
    ]) {
      expect(decodeCursor(bad), bad).toBeNull();
    }
  });
});
