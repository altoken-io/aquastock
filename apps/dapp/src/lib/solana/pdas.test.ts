// jsdom hands web3.js a Uint8Array from another realm, which breaks PDA derivation.
// @vitest-environment node
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import {
  configPda,
  poolPda,
  positionPda,
  programDataPda,
  u64ToLeBytes,
  vaultPda,
} from './pdas';

const program = new PublicKey('92EVZikCaJ1SXTJAq7e8NzzZg5zLKjK2LyX14SQeQRfE');
const sponsor = new PublicKey('11111111111111111111111111111112');
const saver = new PublicKey('11111111111111111111111111111113');

describe('u64ToLeBytes', () => {
  it('encodes little-endian', () => {
    expect([...u64ToLeBytes(1n)]).toEqual([1, 0, 0, 0, 0, 0, 0, 0]);
    expect([...u64ToLeBytes(0x0102n)]).toEqual([2, 1, 0, 0, 0, 0, 0, 0]);
    expect([...u64ToLeBytes(0xffff_ffff_ffff_ffffn)]).toEqual(
      Array<number>(8).fill(255),
    );
  });

  it('rejects values outside u64', () => {
    expect(() => u64ToLeBytes(-1n)).toThrow(RangeError);
    expect(() => u64ToLeBytes(0x1_0000_0000_0000_0000n)).toThrow(RangeError);
  });
});

describe('program addresses', () => {
  it('are deterministic and distinct per input', () => {
    const pool = poolPda(program, sponsor, 1n);
    expect(pool.equals(poolPda(program, sponsor, 1n))).toBe(true);
    expect(pool.equals(poolPda(program, sponsor, 2n))).toBe(false);
    expect(pool.equals(poolPda(program, saver, 1n))).toBe(false);
    expect(vaultPda(program, pool).equals(pool)).toBe(false);
    expect(
      positionPda(program, pool, sponsor).equals(
        positionPda(program, pool, saver),
      ),
    ).toBe(false);
  });

  it('depend on the program id', () => {
    const other = new PublicKey('11111111111111111111111111111114');
    expect(configPda(program).equals(configPda(other))).toBe(false);
    expect(programDataPda(program).equals(programDataPda(other))).toBe(false);
  });
});
