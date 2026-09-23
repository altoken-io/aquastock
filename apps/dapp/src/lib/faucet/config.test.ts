// @vitest-environment node
import { Keypair } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import {
  FAUCET_INFO,
  isFaucetNetwork,
  lamportsToSol,
  parseFaucetSecret,
} from './config';

describe('parseFaucetSecret', () => {
  it('reads the JSON array a Solana keypair file holds', () => {
    const keypair = Keypair.generate();
    const parsed = parseFaucetSecret(
      JSON.stringify(Array.from(keypair.secretKey)),
    );
    expect(parsed?.publicKey.equals(keypair.publicKey)).toBe(true);
  });

  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['not JSON', 'not-a-key'],
    ['a base58 string', '"5Kd3NBUAdUnhyzenEwVLy9pBKxSwXvE9FMPyR4UKZvpe"'],
    ['too short', JSON.stringify(new Array(32).fill(1))],
    ['out-of-range bytes', JSON.stringify(new Array(64).fill(256))],
    ['non-integers', JSON.stringify(new Array(64).fill(1.5))],
    ['an object', JSON.stringify({ secretKey: [] })],
  ])('rejects %s', (_label, value) => {
    expect(parseFaucetSecret(value)).toBeNull();
  });

  it('rejects 64 bytes whose public half does not match the secret', () => {
    const bytes = Array.from(Keypair.generate().secretKey);
    bytes[40] = (bytes[40]! + 1) % 256;
    expect(parseFaucetSecret(JSON.stringify(bytes))).toBeNull();
  });
});

describe('isFaucetNetwork', () => {
  it('runs only on demo networks', () => {
    expect(isFaucetNetwork('devnet')).toBe(true);
    expect(isFaucetNetwork('localnet')).toBe(true);
    expect(isFaucetNetwork('mainnet-beta')).toBe(false);
    expect(isFaucetNetwork('mainnet')).toBe(false);
    expect(isFaucetNetwork('')).toBe(false);
  });
});

describe('lamportsToSol', () => {
  it('formats without trailing zeros or exponent notation', () => {
    expect(lamportsToSol(20_000_000n)).toBe('0.02');
    expect(lamportsToSol(1_000_000_000n)).toBe('1');
    expect(lamportsToSol(1n)).toBe('0.000000001');
    expect(FAUCET_INFO).toEqual({ tokens: '100', sol: '0.02' });
  });
});
