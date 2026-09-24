// The demo faucet: sends demo tokens and a little SOL to a wallet that needs them, so anyone
// can try the product on a demo network without asking the team.
//
// Abuse is bounded, not prevented: anyone can name any wallet, so the faucet only tops up a
// wallet that is actually short, rate-limits by wallet, by IP and in total, and can never
// send more than the faucet wallet holds. The tokens are worthless demo replicas.
import { PublicKey } from '@solana/web3.js';

import type { FaucetDripDto } from '@aquastock/types';

import { ApiError } from '../api/errors';
import { uiToRaw } from '../solana/amounts';
import {
  DRIP_LAMPORTS,
  DRIP_TOKENS,
  FAUCET_SOL_RESERVE_LAMPORTS,
  LOW_SOL_LAMPORTS,
} from './config';

export interface MintFacts {
  decimals: number;
  multiplier: string;
}

export interface DripTransfer {
  recipient: PublicKey;
  tokensRaw: bigint;
  lamports: bigint;
  decimals: number;
}

export interface FaucetChain {
  mint(): Promise<MintFacts>;
  lamports(owner: PublicKey): Promise<bigint>;
  /** Zero when the owner has no token account for the mint. */
  tokenBalance(owner: PublicKey): Promise<bigint>;
  /** Sends and confirms one transaction; returns its signature. */
  send(transfer: DripTransfer): Promise<string>;
}

export interface Limiter {
  limit(identifier: string): Promise<{ success: boolean }>;
}

export interface FaucetDeps {
  chain: FaucetChain;
  faucet: PublicKey;
  limiters: { wallet: Limiter; ip: Limiter; global: Limiter };
}

export interface DripPlan {
  tokensRaw: bigint;
  lamports: bigint;
}

/**
 * What a wallet should get: tokens if it holds less than one drip, SOL if it is low on
 * fees. Null when it needs neither.
 */
export function planDrip(input: {
  recipientTokensRaw: bigint;
  recipientLamports: bigint;
  dripTokensRaw: bigint;
}): DripPlan | null {
  const tokensRaw =
    input.recipientTokensRaw < input.dripTokensRaw ? input.dripTokensRaw : 0n;
  const lamports =
    input.recipientLamports < LOW_SOL_LAMPORTS ? DRIP_LAMPORTS : 0n;
  return tokensRaw === 0n && lamports === 0n ? null : { tokensRaw, lamports };
}

export function parseRecipient(wallet: string): PublicKey {
  const key = new PublicKey(wallet);
  // A program-derived address has no private key, so nobody could use what we sent it.
  if (!PublicKey.isOnCurve(key.toBytes())) {
    throw new ApiError(
      400,
      'invalid_wallet',
      'send demo funds to a wallet address, not a program account',
    );
  }
  return key;
}

const rateLimited = () =>
  new ApiError(
    429,
    'faucet_rate_limited',
    'this wallet or network has had its demo funds for now; try again later',
  );

export async function drip(
  deps: FaucetDeps,
  wallet: string,
  ip: string,
): Promise<FaucetDripDto> {
  const recipient = parseRecipient(wallet);
  if (recipient.equals(deps.faucet)) {
    throw new ApiError(400, 'invalid_wallet', 'that is the faucet itself');
  }

  const [mint, recipientTokensRaw, recipientLamports] = await Promise.all([
    deps.chain.mint(),
    deps.chain.tokenBalance(recipient),
    deps.chain.lamports(recipient),
  ]);
  // Round up, the way the app converts every typed amount: the wallet then shows exactly the
  // advertised 100, not 99.9999, and a pool capped at 100 accepts all of it.
  const dripTokensRaw = uiToRaw(
    DRIP_TOKENS,
    mint.decimals,
    mint.multiplier,
    'up',
  );
  const plan = planDrip({
    recipientTokensRaw,
    recipientLamports,
    dripTokensRaw,
  });
  if (!plan) {
    throw new ApiError(
      409,
      'already_funded',
      'this wallet already has enough to try the demo',
    );
  }

  // Checked after the plan, so asking for a wallet that needs nothing costs no budget. The IP
  // goes first, so a caller who is out of requests cannot use up someone else's wallet
  // allowance by naming it; the total budget goes last, so a refused request never spends it.
  if (!(await deps.limiters.ip.limit(ip)).success) throw rateLimited();
  if (!(await deps.limiters.wallet.limit(recipient.toBase58())).success)
    throw rateLimited();
  if (!(await deps.limiters.global.limit('all')).success) throw rateLimited();

  const [faucetTokensRaw, faucetLamports] = await Promise.all([
    deps.chain.tokenBalance(deps.faucet),
    deps.chain.lamports(deps.faucet),
  ]);
  if (
    faucetTokensRaw < plan.tokensRaw ||
    faucetLamports < plan.lamports + FAUCET_SOL_RESERVE_LAMPORTS
  ) {
    console.error('demo faucet is empty; top it up', {
      faucet: deps.faucet.toBase58(),
    });
    throw new ApiError(
      503,
      'faucet_empty',
      'the demo faucet is empty right now; try again later',
    );
  }

  let signature: string;
  try {
    signature = await deps.chain.send({
      recipient,
      tokensRaw: plan.tokensRaw,
      lamports: plan.lamports,
      decimals: mint.decimals,
    });
  } catch (error) {
    console.error('demo faucet transfer failed', error);
    throw new ApiError(
      502,
      'faucet_failed',
      'the network did not confirm the transfer; try again',
    );
  }

  return {
    signature,
    tokensRaw: plan.tokensRaw.toString(),
    lamports: plan.lamports.toString(),
  };
}

export interface FaucetStatus {
  address: string;
  tokensRaw: bigint;
  lamports: bigint;
  /** Fewer than ten full drips left of either tokens or SOL: time to top it up. */
  low: boolean;
}

const LOW_WATER_DRIPS = 10n;

/** The faucet's remaining balance, for the operator console. */
export async function faucetStatus(deps: FaucetDeps): Promise<FaucetStatus> {
  const [mint, tokensRaw, lamports] = await Promise.all([
    deps.chain.mint(),
    deps.chain.tokenBalance(deps.faucet),
    deps.chain.lamports(deps.faucet),
  ]);
  const dripTokensRaw = uiToRaw(
    DRIP_TOKENS,
    mint.decimals,
    mint.multiplier,
    'up',
  );
  return {
    address: deps.faucet.toBase58(),
    tokensRaw,
    lamports,
    low:
      tokensRaw < dripTokensRaw * LOW_WATER_DRIPS ||
      lamports < DRIP_LAMPORTS * LOW_WATER_DRIPS + FAUCET_SOL_RESERVE_LAMPORTS,
  };
}
