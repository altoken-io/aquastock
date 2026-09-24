// @vitest-environment node
import { Keypair, PublicKey } from '@solana/web3.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/errors';
import { poolPda } from '../solana/pdas';
import {
  DRIP_LAMPORTS,
  FAUCET_SOL_RESERVE_LAMPORTS,
  LOW_SOL_LAMPORTS,
} from './config';
import {
  drip,
  faucetStatus,
  planDrip,
  type DripTransfer,
  type FaucetDeps,
  type Limiter,
} from './service';

// 100 tokens at 8 decimals with no display multiplier.
const DRIP_RAW = 10_000_000_000n;

const allow: Limiter = { limit: () => Promise.resolve({ success: true }) };
const deny: Limiter = { limit: () => Promise.resolve({ success: false }) };

function setup(
  options: {
    recipientTokens?: bigint;
    recipientLamports?: bigint;
    faucetTokens?: bigint;
    faucetLamports?: bigint;
    multiplier?: string;
    limiters?: Partial<FaucetDeps['limiters']>;
    sendFails?: boolean;
  } = {},
) {
  const faucet = Keypair.generate().publicKey;
  const sent: DripTransfer[] = [];
  const balances = (owner: PublicKey, forFaucet: bigint, other: bigint) =>
    owner.equals(faucet) ? forFaucet : other;
  const deps: FaucetDeps = {
    faucet,
    chain: {
      mint: () =>
        Promise.resolve({
          decimals: 8,
          multiplier: options.multiplier ?? '1',
        }),
      tokenBalance: (owner) =>
        Promise.resolve(
          balances(
            owner,
            options.faucetTokens ?? 1_000_000n * DRIP_RAW,
            options.recipientTokens ?? 0n,
          ),
        ),
      lamports: (owner) =>
        Promise.resolve(
          balances(
            owner,
            options.faucetLamports ?? 10_000_000_000n,
            options.recipientLamports ?? 0n,
          ),
        ),
      send: (transfer) => {
        if (options.sendFails) return Promise.reject(new Error('blockhash'));
        sent.push(transfer);
        return Promise.resolve('sig-1');
      },
    },
    limiters: { wallet: allow, ip: allow, global: allow, ...options.limiters },
  };
  return { deps, sent };
}

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  if (!(error instanceof ApiError)) throw new Error('expected an ApiError');
  return error;
}

const wallet = () => Keypair.generate().publicKey.toBase58();

afterEach(() => vi.restoreAllMocks());

describe('planDrip', () => {
  it('sends tokens and SOL to an empty wallet', () => {
    expect(
      planDrip({
        recipientTokensRaw: 0n,
        recipientLamports: 0n,
        dripTokensRaw: DRIP_RAW,
      }),
    ).toEqual({ tokensRaw: DRIP_RAW, lamports: DRIP_LAMPORTS });
  });

  it('sends only what is short', () => {
    expect(
      planDrip({
        recipientTokensRaw: DRIP_RAW,
        recipientLamports: 0n,
        dripTokensRaw: DRIP_RAW,
      }),
    ).toEqual({ tokensRaw: 0n, lamports: DRIP_LAMPORTS });
    expect(
      planDrip({
        recipientTokensRaw: DRIP_RAW - 1n,
        recipientLamports: LOW_SOL_LAMPORTS,
        dripTokensRaw: DRIP_RAW,
      }),
    ).toEqual({ tokensRaw: DRIP_RAW, lamports: 0n });
  });

  it('sends nothing to a wallet that has enough of both', () => {
    expect(
      planDrip({
        recipientTokensRaw: DRIP_RAW,
        recipientLamports: LOW_SOL_LAMPORTS,
        dripTokensRaw: DRIP_RAW,
      }),
    ).toBeNull();
  });
});

describe('drip', () => {
  it('sends 100 tokens and fee SOL in one transaction', async () => {
    const { deps, sent } = setup();
    const recipient = wallet();
    const result = await drip(deps, recipient, '1.2.3.4');
    expect(result).toEqual({
      signature: 'sig-1',
      tokensRaw: DRIP_RAW.toString(),
      lamports: DRIP_LAMPORTS.toString(),
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.recipient.toBase58()).toBe(recipient);
    expect(sent[0]?.decimals).toBe(8);
  });

  it('converts the advertised amount through the display multiplier, rounding up like typed amounts', async () => {
    const { deps, sent } = setup({ multiplier: '1.005714560286254' });
    await drip(deps, wallet(), 'ip');
    // ceil(100e8 / 1.005714560286254): a wallet shows exactly 100, the same raw amount a
    // pool capped at 100 allows.
    expect(sent[0]?.tokensRaw).toBe(9_943_179_104n);
  });

  it('refuses a wallet that already has enough, without spending rate-limit budget', async () => {
    const limit = vi.fn(() => Promise.resolve({ success: true }));
    const { deps, sent } = setup({
      recipientTokens: DRIP_RAW,
      recipientLamports: LOW_SOL_LAMPORTS,
      limiters: { wallet: { limit }, ip: { limit }, global: { limit } },
    });
    const error = await rejection(drip(deps, wallet(), 'ip'));
    expect(error.status).toBe(409);
    expect(error.code).toBe('already_funded');
    expect(limit).not.toHaveBeenCalled();
    expect(sent).toHaveLength(0);
  });

  it('refuses a program-derived address, which nobody could spend from', async () => {
    const { deps } = setup();
    const pda = poolPda(Keypair.generate().publicKey, PublicKey.default, 1n);
    const error = await rejection(drip(deps, pda.toBase58(), 'ip'));
    expect(error.code).toBe('invalid_wallet');
  });

  it('refuses to send to itself', async () => {
    const { deps } = setup();
    const error = await rejection(drip(deps, deps.faucet.toBase58(), 'ip'));
    expect(error.code).toBe('invalid_wallet');
  });

  it.each(['wallet', 'ip', 'global'] as const)(
    'stops when the %s budget is spent',
    async (which) => {
      const { deps, sent } = setup({ limiters: { [which]: deny } });
      const error = await rejection(drip(deps, wallet(), 'ip'));
      expect(error.status).toBe(429);
      expect(error.code).toBe('faucet_rate_limited');
      expect(sent).toHaveLength(0);
    },
  );

  it('does not spend a named wallet allowance when the caller IP is out of requests', async () => {
    const walletLimit = vi.fn(() => Promise.resolve({ success: true }));
    const { deps, sent } = setup({
      limiters: { ip: deny, wallet: { limit: walletLimit } },
    });
    await rejection(drip(deps, wallet(), 'ip'));
    expect(walletLimit).not.toHaveBeenCalled();
    expect(sent).toHaveLength(0);
  });

  it('does not spend the global budget when the wallet budget refuses', async () => {
    const global = vi.fn(() => Promise.resolve({ success: true }));
    const { deps } = setup({
      limiters: { wallet: deny, global: { limit: global } },
    });
    await rejection(drip(deps, wallet(), 'ip'));
    expect(global).not.toHaveBeenCalled();
  });

  it('reports an empty faucet instead of sending a failing transaction', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { deps, sent } = setup({ faucetTokens: DRIP_RAW - 1n });
    const error = await rejection(drip(deps, wallet(), 'ip'));
    expect(error.status).toBe(503);
    expect(error.code).toBe('faucet_empty');
    expect(sent).toHaveLength(0);
  });

  it('keeps a SOL reserve for its own fees', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { deps } = setup({
      faucetLamports: DRIP_LAMPORTS + FAUCET_SOL_RESERVE_LAMPORTS - 1n,
    });
    const error = await rejection(drip(deps, wallet(), 'ip'));
    expect(error.code).toBe('faucet_empty');
  });

  it('still sends SOL when only tokens are empty and the wallet needs no tokens', async () => {
    const { deps, sent } = setup({
      faucetTokens: 0n,
      recipientTokens: DRIP_RAW,
    });
    await drip(deps, wallet(), 'ip');
    expect(sent[0]).toMatchObject({ tokensRaw: 0n, lamports: DRIP_LAMPORTS });
  });

  it('turns a network failure into a retryable error without leaking details', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { deps } = setup({ sendFails: true });
    const error = await rejection(drip(deps, wallet(), 'ip'));
    expect(error.status).toBe(502);
    expect(error.code).toBe('faucet_failed');
    expect(error.message).not.toContain('blockhash');
    expect(log).toHaveBeenCalled();
  });
});

describe('faucetStatus', () => {
  it('reports the balance and is not low with plenty left', async () => {
    const { deps } = setup();
    const status = await faucetStatus(deps);
    expect(status.address).toBe(deps.faucet.toBase58());
    expect(status.low).toBe(false);
  });

  it('flags fewer than ten drips of tokens left', async () => {
    const { deps } = setup({ faucetTokens: DRIP_RAW * 10n - 1n });
    expect((await faucetStatus(deps)).low).toBe(true);
  });

  it('flags fewer than ten drips of SOL left, after its own reserve', async () => {
    const { deps } = setup({
      faucetLamports: DRIP_LAMPORTS * 10n + FAUCET_SOL_RESERVE_LAMPORTS - 1n,
    });
    expect((await faucetStatus(deps)).low).toBe(true);
  });
});
