// @vitest-environment node
import { matchPoolsIdl } from '@aquastock/types/program';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { configPda, poolPda, positionPda, vaultPda } from '@/lib/solana/pdas';
import { createMatchPoolsProgram } from '@/lib/solana/program';

import {
  buildClaim,
  buildClosePosition,
  buildCreatePool,
  buildDeposit,
  buildFundMatch,
  buildReclaim,
  buildWithdraw,
  randomPoolId,
  tokenAccountOf,
} from './builders';

const ATA_PROGRAM = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);
const programId = Keypair.generate().publicKey;
const program = createMatchPoolsProgram(
  { connection: new Connection('http://127.0.0.1:1') },
  programId,
);
const sponsor = Keypair.generate().publicKey;
const saver = Keypair.generate().publicKey;
const mint = Keypair.generate().publicKey;
const pool = poolPda(programId, sponsor, 7n);
const vault = vaultPda(programId, pool);

const discriminator = (name: string): number[] => {
  const found = matchPoolsIdl.instructions.find((i) => i.name === name);
  if (!found) throw new Error(`no instruction ${name}`);
  return [...found.discriminator];
};
const u64At = (data: Uint8Array, offset: number): bigint =>
  Buffer.from(data).readBigUInt64LE(offset);

describe('buildDeposit', () => {
  it('sends the amount and the minimum match to the right accounts', async () => {
    const [ix, ...rest] = await buildDeposit({
      program,
      pool,
      mint,
      saver,
      amountRaw: 40_000_000n,
      minMatchRaw: 39_000_000n,
    });
    expect(rest).toEqual([]);
    expect(ix?.programId.equals(programId)).toBe(true);
    const data = ix?.data ?? Buffer.alloc(0);
    expect([...data.subarray(0, 8)]).toEqual(discriminator('deposit'));
    expect(u64At(data, 8)).toBe(40_000_000n);
    expect(u64At(data, 16)).toBe(39_000_000n);

    const keys = ix?.keys.map((k) => k.pubkey.toBase58());
    expect(keys).toEqual(
      [
        saver,
        pool,
        positionPda(programId, pool, saver),
        mint,
        vault,
        tokenAccountOf(mint, saver),
        TOKEN_2022_PROGRAM_ID,
        SystemProgram.programId,
      ].map((k) => k.toBase58()),
    );
    // Only the saver signs.
    expect(
      ix?.keys.filter((k) => k.isSigner).map((k) => k.pubkey.toBase58()),
    ).toEqual([saver.toBase58()]);
  });
});

describe('claim and withdraw', () => {
  it('make sure the payout account exists before paying into it', async () => {
    for (const build of [buildClaim, buildWithdraw]) {
      const [ensure, ix] = await build({ program, pool, mint, saver });
      expect(ensure?.programId.equals(ATA_PROGRAM)).toBe(true);
      // The associated-token program's "create idempotent" instruction.
      expect([...(ensure?.data ?? [])]).toEqual([1]);
      expect(ensure?.keys[1]?.pubkey.equals(tokenAccountOf(mint, saver))).toBe(
        true,
      );
      expect(ix?.programId.equals(programId)).toBe(true);
    }
  });

  it('are different instructions with the same accounts', async () => {
    const claim = (await buildClaim({ program, pool, mint, saver }))[1];
    const withdraw = (await buildWithdraw({ program, pool, mint, saver }))[1];
    expect([...(claim?.data ?? [])]).toEqual(discriminator('claimVested'));
    expect([...(withdraw?.data ?? [])]).toEqual(discriminator('withdraw'));
    expect(claim?.keys.map((k) => k.pubkey.toBase58())).toEqual(
      withdraw?.keys.map((k) => k.pubkey.toBase58()),
    );
  });
});

describe('buildClosePosition', () => {
  it('needs only the saver, the pool and the position', async () => {
    const [ix] = await buildClosePosition({ program, pool, saver });
    expect([...(ix?.data ?? [])]).toEqual(discriminator('closePosition'));
    expect(ix?.keys.map((k) => k.pubkey.toBase58())).toEqual(
      [saver, pool, positionPda(programId, pool, saver)].map((k) =>
        k.toBase58(),
      ),
    );
  });
});

describe('sponsor actions', () => {
  it('fund the vault from the sponsor token account', async () => {
    const [ix] = await buildFundMatch({
      program,
      pool,
      mint,
      sponsor,
      amountRaw: 1_000_000_000n,
    });
    expect([...(ix?.data.subarray(0, 8) ?? [])]).toEqual(
      discriminator('fundMatch'),
    );
    expect(u64At(ix?.data ?? Buffer.alloc(16), 8)).toBe(1_000_000_000n);
    expect(ix?.keys.map((k) => k.pubkey.toBase58())).toEqual(
      [
        sponsor,
        pool,
        mint,
        vault,
        tokenAccountOf(mint, sponsor),
        TOKEN_2022_PROGRAM_ID,
      ].map((k) => k.toBase58()),
    );
  });

  it('reclaim into an account that is created first if needed', async () => {
    const [ensure, ix] = await buildReclaim({ program, pool, mint, sponsor });
    expect(ensure?.programId.equals(ATA_PROGRAM)).toBe(true);
    expect([...(ix?.data ?? [])]).toEqual(discriminator('reclaimUnmatched'));
  });
});

describe('buildCreatePool', () => {
  it('creates and funds the pool in one transaction at the derived addresses', async () => {
    const { pool: created, instructions } = await buildCreatePool({
      program,
      mint,
      sponsor,
      input: {
        poolId: 42n,
        matchBps: 10_000,
        perSaverCap: 100_000_000n,
        vestingSeconds: 180,
        endsAt: 1_900_000_000,
        budgetRaw: 1_000_000_000n,
      },
    });
    expect(created.equals(poolPda(programId, sponsor, 42n))).toBe(true);
    expect(instructions).toHaveLength(2);
    const [create, fund] = instructions;
    expect([...(create?.data.subarray(0, 8) ?? [])]).toEqual(
      discriminator('createPool'),
    );
    expect([...(fund?.data.subarray(0, 8) ?? [])]).toEqual(
      discriminator('fundMatch'),
    );

    const createKeys = create?.keys.map((k) => k.pubkey.toBase58());
    expect(createKeys).toContain(configPda(programId).toBase58());
    expect(createKeys).toContain(vaultPda(programId, created).toBase58());
    // pool_id, match_bps (u16), per_saver_cap, vesting_seconds, ends_at.
    const data = create?.data ?? Buffer.alloc(0);
    expect(u64At(data, 8)).toBe(42n);
    expect(Buffer.from(data).readUInt16LE(16)).toBe(10_000);
    expect(u64At(data, 18)).toBe(100_000_000n);
    expect(u64At(data, 26)).toBe(180n);
    expect(u64At(data, 34)).toBe(1_900_000_000n);
    expect(u64At(fund?.data ?? Buffer.alloc(16), 8)).toBe(1_000_000_000n);
  });
});

describe('randomPoolId', () => {
  it('stays below 2^52 and does not repeat', () => {
    const seen = new Set<bigint>();
    for (let i = 0; i < 500; i += 1) {
      const id = randomPoolId();
      expect(id >= 0n && id < 1n << 52n).toBe(true);
      seen.add(id);
    }
    expect(seen.size).toBe(500);
  });
});
