// @vitest-environment node
import { BN } from '@anchor-lang/core';
import { PublicKey, type AccountInfo } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import {
  createChainClient,
  fetchPool,
  fetchPositionForWallet,
  multiplierToString,
  parseTokenLabels,
} from './chain';
import { PROGRAM_ID, newKey } from './test-fakes';

// No request is made: `getAccountInfo` is stubbed, and the client is only used for its coder.
const client = createChainClient('http://127.0.0.1:9', PROGRAM_ID);

function accountInfo(owner: PublicKey, data: Buffer): AccountInfo<Buffer> {
  return { owner, data, lamports: 1, executable: false, rentEpoch: 0 };
}

const stub = (info: AccountInfo<Buffer> | null) =>
  vi.spyOn(client.connection, 'getAccountInfo').mockResolvedValue(info);

const poolFields = {
  sponsor: newKey(),
  mint: newKey(),
  vault: newKey(),
  poolId: new BN(7),
  matchBps: 10_000,
  perSaverCap: new BN(100),
  vestingSeconds: new BN(1_000),
  createdAt: new BN(1_800_000_000),
  endsAt: new BN(1_800_086_400),
  budgetTotal: new BN(500),
  reserved: new BN(40),
  claimed: new BN(0),
  depositsTotal: new BN(40),
  bump: 254,
  vaultBump: 253,
};

describe('fetchPool', () => {
  it('decodes a pool account owned by the program', async () => {
    const data = await client.program.coder.accounts.encode('pool', poolFields);
    stub(accountInfo(PROGRAM_ID, data));
    const address = newKey();
    const pool = await fetchPool(client, address);
    expect(pool).toMatchObject({
      poolId: 7n,
      matchBps: 10_000,
      budgetTotal: 500n,
      reserved: 40n,
      endsAt: 1_800_086_400,
    });
    expect(pool?.address.equals(address)).toBe(true);
    expect(pool?.sponsor.equals(poolFields.sponsor)).toBe(true);
  });

  it('is null for a missing account', async () => {
    stub(null);
    expect(await fetchPool(client, newKey())).toBeNull();
  });

  it('is null, not an error, for an account owned by another program', async () => {
    // What a wallet or the System Program looks like. Anchor's fetchNullable would throw here.
    stub(
      accountInfo(
        new PublicKey('11111111111111111111111111111111'),
        Buffer.alloc(0),
      ),
    );
    expect(await fetchPool(client, newKey())).toBeNull();
  });

  it('is null for a perfectly pool-shaped account that another program owns', async () => {
    // Anyone can create an account whose bytes look exactly like a pool, including the
    // discriminator. Only the owner check stops it from being read as one of ours, so this
    // must fail on ownership alone, not because the data happens to be undecodable.
    const forged = await client.program.coder.accounts.encode(
      'pool',
      poolFields,
    );
    stub(accountInfo(newKey(), forged));
    expect(await fetchPool(client, newKey())).toBeNull();

    const position = await client.program.coder.accounts.encode('position', {
      pool: newKey(),
      saver: newKey(),
      deposited: new BN(1),
      matchReserved: new BN(1),
      matchClaimed: new BN(0),
      startedAt: new BN(1),
      settled: false,
      bump: 1,
    });
    stub(accountInfo(newKey(), position));
    expect(await fetchPositionForWallet(client, newKey(), newKey())).toBeNull();
  });

  it('is null for an account of this program that is not a pool', async () => {
    const config = await client.program.coder.accounts.encode('config', {
      admin: newKey(),
      allowedMint: newKey(),
      bump: 1,
    });
    stub(accountInfo(PROGRAM_ID, config));
    expect(await fetchPool(client, newKey())).toBeNull();
    // Truncated or garbage data owned by the program never decodes as a pool either.
    stub(accountInfo(PROGRAM_ID, Buffer.alloc(3)));
    expect(await fetchPool(client, newKey())).toBeNull();
    stub(accountInfo(PROGRAM_ID, Buffer.alloc(200, 0xff)));
    expect(await fetchPool(client, newKey())).toBeNull();
  });

  it('lets a real RPC failure through, so it is not mistaken for "no such pool"', async () => {
    vi.spyOn(client.connection, 'getAccountInfo').mockRejectedValue(
      new Error('rpc down'),
    );
    await expect(fetchPool(client, newKey())).rejects.toThrow('rpc down');
  });
});

describe('fetchPositionForWallet', () => {
  const pool = newKey();
  const saver = newKey();
  const fields = {
    pool,
    saver,
    deposited: new BN(10),
    matchReserved: new BN(10),
    matchClaimed: new BN(0),
    startedAt: new BN(1_800_000_000),
    settled: false,
    bump: 255,
  };

  it('decodes a position that belongs to the pool', async () => {
    stub(
      accountInfo(
        PROGRAM_ID,
        await client.program.coder.accounts.encode('position', fields),
      ),
    );
    const position = await fetchPositionForWallet(client, pool, newKey());
    expect(position).toMatchObject({
      deposited: 10n,
      matchReserved: 10n,
      settled: false,
    });
  });

  it('is null when the position belongs to a different pool or is missing', async () => {
    stub(
      accountInfo(
        PROGRAM_ID,
        await client.program.coder.accounts.encode('position', fields),
      ),
    );
    expect(await fetchPositionForWallet(client, newKey(), newKey())).toBeNull();
    stub(null);
    expect(await fetchPositionForWallet(client, pool, newKey())).toBeNull();
  });
});

describe('multiplierToString', () => {
  it('prints plain decimals, never exponent notation', () => {
    expect(multiplierToString(1.005714560286254)).toBe('1.005714560286254');
    expect(multiplierToString(1)).toBe('1.0');
    expect(multiplierToString(1.2)).toBe('1.2');
    expect(multiplierToString(0.0000001)).toBe('0.0000001');
    expect(multiplierToString(1e-20)).toBe('0.0');
  });
});

describe('parseTokenLabels', () => {
  // Update authority (32) and mint (32), then borsh strings name, symbol, uri.
  const encode = (name: string, symbol: string, uri: string): Uint8Array => {
    const string = (value: string): Buffer => {
      const bytes = Buffer.from(value, 'utf8');
      const length = Buffer.alloc(4);
      length.writeUInt32LE(bytes.length);
      return Buffer.concat([length, bytes]);
    };
    return Buffer.concat([
      Buffer.alloc(64, 7),
      string(name),
      string(symbol),
      string(uri),
    ]);
  };

  it('reads name and symbol', () => {
    expect(
      parseTokenLabels(
        encode('SP500 xStock', 'SPYx', 'https://x.example/m.json'),
      ),
    ).toEqual({
      name: 'SP500 xStock',
      symbol: 'SPYx',
    });
    expect(
      parseTokenLabels(encode('SPYx (demo replica)', 'dSPYx', '')),
    ).toEqual({
      name: 'SPYx (demo replica)',
      symbol: 'dSPYx',
    });
  });

  it('treats blank labels as missing', () => {
    expect(parseTokenLabels(encode('  ', '', ''))).toEqual({
      name: null,
      symbol: null,
    });
  });

  it('never throws on missing, short, truncated or hostile data', () => {
    const empty = { name: null, symbol: null };
    expect(parseTokenLabels(null)).toEqual(empty);
    expect(parseTokenLabels(new Uint8Array(10))).toEqual(empty);
    expect(
      parseTokenLabels(encode('name', 'sym', 'uri').subarray(0, 70)),
    ).toEqual(empty);
    // A length prefix that claims far more bytes than exist.
    const huge = Buffer.concat([
      Buffer.alloc(64),
      Buffer.from([0xff, 0xff, 0xff, 0x7f]),
    ]);
    expect(parseTokenLabels(huge)).toEqual(empty);
    // Invalid UTF-8 in the name.
    const bad = Buffer.concat([
      Buffer.alloc(64),
      Buffer.from([2, 0, 0, 0, 0xc3, 0x28]),
    ]);
    expect(parseTokenLabels(bad)).toEqual(empty);
    // A name that parses but a symbol that is cut off.
    const cut = encode('Name', 'Symbol', 'u').subarray(0, 64 + 4 + 4 + 4 + 2);
    expect(parseTokenLabels(cut)).toEqual({ name: 'Name', symbol: null });
  });
});
