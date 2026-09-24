// Pre-flight for the live demo. Checks, read-only, everything a judge needs from the deployed
// app: the build, the faucet, a pool with match left, the database, the price, the pages and
// the public repo. With --live it then runs a real saver round trip on the deployment's
// network with a throwaway wallet (faucet → deposit → claim → withdraw → claim → close),
// recording each transaction in the activity feed exactly as the app does, and times it.
//
//   pnpm demo:preflight
//   pnpm demo:preflight --live
//   pnpm demo:preflight --app <url> --web <url> --repo <owner/name> --faucet <address>
//                       --rpc <url> --until <ISO date>
//
// Needs no keys: --live uses a keypair generated in memory and funded by the app's faucet.
// Exits 1 when any check fails, so it can gate a demo or a submission.
import { execFileSync } from 'node:child_process';

import { AnchorProvider, BN, Wallet } from '@anchor-lang/core';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { z } from 'zod';

import {
  DRIP_LAMPORTS,
  DRIP_TOKENS,
  FAUCET_SOL_RESERVE_LAMPORTS,
} from '../../apps/dapp/src/lib/faucet/config';
import { rawToUi, uiToRaw } from '../../apps/dapp/src/lib/solana/amounts';
import { positionPda, vaultPda } from '../../apps/dapp/src/lib/solana/pdas';
import { createMatchPoolsProgram } from '../../apps/dapp/src/lib/solana/program';
import { parseFlags, sleep } from './lib';

const DEFAULT_APP = 'https://aquastock-dapp.vercel.app';
const DEFAULT_WEB = 'https://aquastock-tawny.vercel.app';
/** Stocklana judging runs through 2 October 2026; a pool that closes before then fails a judge. */
const DEFAULT_UNTIL = '2026-10-03T00:00:00-04:00';
const PUBLIC_RPC: Record<string, string> = {
  devnet: 'https://api.devnet.solana.com',
};
/** A Token-2022 account with the replica's extensions costs about this much rent. */
const TOKEN_ACCOUNT_RENT_ESTIMATE = 2_500_000n;
/** Below this many savers' worth of match left, top the pool up before judging. */
const LOW_SEATS = 20n;
const LOW_DRIPS = 50n;
const DISCLAIMER = 'does not constitute an offer of securities';

// ---- response shapes (only the fields this script reads) ----

const decimalString = z.string().regex(/^\d+$/);
const deploymentSchema = z.object({
  programId: z.string(),
  network: z.string(),
  allowedMint: z.string().nullable(),
  issuer: z
    .object({
      decimals: z.number().int(),
      symbol: z.string().nullable(),
      paused: z.boolean(),
      multiplier: z.string(),
    })
    .nullable(),
  faucet: z.object({ tokens: z.string(), sol: z.string() }).nullable(),
});
const poolSchema = z.object({
  address: z.string(),
  matchBps: z.number().int(),
  perSaverCap: decimalString,
  vestingSeconds: z.number().int(),
  endsAt: z.number().int(),
  unreserved: decimalString,
  metadata: z.object({ name: z.string() }).nullable(),
});
type Pool = z.infer<typeof poolSchema>;
const poolsSchema = z.object({ pools: z.array(poolSchema) });
const positionSchema = z.object({
  deposited: decimalString,
  matchReserved: decimalString,
  matchClaimed: decimalString,
  settled: z.boolean(),
});
const poolDetailSchema = z.object({ position: positionSchema.nullable() });
const priceSchema = z.object({
  pair: z.string(),
  price: z.string(),
  publishTime: z.number().int(),
});
const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
const versionSchema = z.object({ buildId: z.string() });
const dripSchema = z.object({
  signature: z.string(),
  tokensRaw: decimalString,
});

// ---- output ----

type Status = 'pass' | 'warn' | 'fail';
const results: Status[] = [];
const MARK: Record<Status, string> = {
  pass: '  PASS',
  warn: '  WARN',
  fail: '  FAIL',
};

function report(status: Status, label: string, detail: string): void {
  results.push(status);
  console.log(`${MARK[status]}  ${label.padEnd(18)} ${detail}`);
}

// ---- http ----

interface HttpResult {
  status: number;
  body: unknown;
  text: string;
  headers: Headers;
}

async function http(
  url: string,
  init: RequestInit = {},
): Promise<HttpResult | null> {
  try {
    const response = await fetch(url, {
      ...init,
      redirect: 'follow',
      signal: AbortSignal.timeout(30_000),
    });
    const text = await response.text();
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      // Pages answer HTML; callers that need JSON check the parse themselves.
    }
    return { status: response.status, body, text, headers: response.headers };
  } catch {
    return null;
  }
}

function errorCode(body: unknown): string {
  const parsed = errorSchema.safeParse(body);
  return parsed.success ? parsed.data.error.code : 'unknown_error';
}

function postJson(url: string, body: unknown): Promise<HttpResult | null> {
  return http(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function git(args: string[]): string | null {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function repoFromOrigin(): string | null {
  const origin = git(['remote', 'get-url', 'origin']);
  const match = origin?.match(/github\.com[/:]([^/]+\/[^/.]+)/);
  return match?.[1] ?? null;
}

const short = (address: string) =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;

// ---- read-only checks ----

interface Context {
  app: string;
  web: string;
  until: number;
  deployment: z.infer<typeof deploymentSchema> | null;
  pool: Pool | null;
}

async function checkBuild(ctx: Context): Promise<void> {
  const response = await http(`${ctx.app}/api/version`);
  const parsed = versionSchema.safeParse(response?.body);
  if (!parsed.success) {
    report('fail', 'App', `${ctx.app} did not answer /api/version`);
    return;
  }
  const deployed = parsed.data.buildId;
  const head = git(['rev-parse', 'HEAD']);
  if (!head || deployed === head) {
    report('pass', 'App build', `${deployed.slice(0, 7)} is live`);
  } else {
    report(
      'warn',
      'App build',
      `live is ${deployed.slice(0, 7)}, this checkout is ${head.slice(0, 7)}: push and let Vercel redeploy if that is not intended`,
    );
  }
}

async function checkDeployment(ctx: Context): Promise<void> {
  const response = await http(`${ctx.app}/api/deployment`);
  const parsed = deploymentSchema.safeParse(response?.body);
  if (!parsed.success) {
    report(
      'fail',
      'Deployment',
      `/api/deployment answered ${response?.status ?? 'nothing'} (${errorCode(response?.body)})`,
    );
    return;
  }
  const deployment = parsed.data;
  ctx.deployment = deployment;
  report(
    'pass',
    'Network',
    `${deployment.network}, program ${short(deployment.programId)}`,
  );
  if (!deployment.allowedMint || !deployment.issuer) {
    report(
      'fail',
      'Token',
      'no allowed mint: the program config was never initialised',
    );
  } else if (deployment.issuer.paused) {
    report(
      'fail',
      'Token',
      `${deployment.issuer.symbol ?? 'the token'} is paused by its issuer: nobody can deposit, claim or withdraw`,
    );
  } else {
    report(
      'pass',
      'Token',
      `${deployment.issuer.symbol ?? short(deployment.allowedMint)} transfers are live (multiplier ${deployment.issuer.multiplier})`,
    );
  }
  if (deployment.faucet) {
    report(
      'pass',
      'Demo faucet',
      `on: ${deployment.faucet.tokens} tokens and ${deployment.faucet.sol} SOL per wallet`,
    );
  } else if (deployment.network === 'mainnet-beta') {
    report('pass', 'Demo faucet', 'off, as it must be on mainnet');
  } else {
    report(
      'fail',
      'Demo faucet',
      'off: a judge with a new wallet cannot get tokens. Set FAUCET_SECRET_KEY (Production) in Vercel and redeploy',
    );
  }
}

async function checkFaucetBalance(
  ctx: Context,
  faucetAddress: string | undefined,
  rpc: string | undefined,
): Promise<void> {
  const deployment = ctx.deployment;
  // Checked even while the deployment reports the faucet off, so the wallet can be funded and
  // confirmed before FAUCET_SECRET_KEY goes live.
  if (!faucetAddress || !deployment?.issuer || !deployment.allowedMint || !rpc)
    return;
  const faucet = new PublicKey(faucetAddress);
  const connection = new Connection(rpc, 'confirmed');
  const mint = new PublicKey(deployment.allowedMint);
  const ata = getAssociatedTokenAddressSync(
    mint,
    faucet,
    false,
    TOKEN_2022_PROGRAM_ID,
  );
  const [lamports, tokens] = await Promise.all([
    connection.getBalance(faucet, 'confirmed'),
    connection
      .getTokenAccountBalance(ata, 'confirmed')
      .then((balance) => BigInt(balance.value.amount))
      .catch(() => 0n),
  ]);
  const dripRaw = uiToRaw(
    deployment.faucet?.tokens ?? DRIP_TOKENS,
    deployment.issuer.decimals,
    deployment.issuer.multiplier,
    'up',
  );
  const spendableLamports =
    BigInt(lamports) > FAUCET_SOL_RESERVE_LAMPORTS
      ? BigInt(lamports) - FAUCET_SOL_RESERVE_LAMPORTS
      : 0n;
  const drips = [
    tokens / dripRaw,
    spendableLamports / (DRIP_LAMPORTS + TOKEN_ACCOUNT_RENT_ESTIMATE),
  ].reduce((a, b) => (a < b ? a : b));
  const detail = `about ${drips} requests left (${rawToUi(tokens, deployment.issuer.decimals, deployment.issuer.multiplier, 0)} tokens, ${(lamports / 1e9).toFixed(3)} SOL)`;
  report(
    drips === 0n ? 'fail' : drips < LOW_DRIPS ? 'warn' : 'pass',
    'Faucet balance',
    drips < LOW_DRIPS ? `${detail}: top it up with pnpm solana:faucet` : detail,
  );
}

async function checkPools(ctx: Context): Promise<void> {
  const response = await http(`${ctx.app}/api/pools?status=open&limit=100`);
  const parsed = poolsSchema.safeParse(response?.body);
  if (!parsed.success) {
    report(
      'fail',
      'Pools',
      `/api/pools answered ${response?.status ?? 'nothing'} (${errorCode(response?.body)})`,
    );
    return;
  }
  // The pool with the most match left is the one to send judges to.
  const seats = (pool: Pool): bigint => {
    const matchPerSaver =
      (BigInt(pool.perSaverCap) * BigInt(pool.matchBps)) / 10_000n;
    return matchPerSaver === 0n ? 0n : BigInt(pool.unreserved) / matchPerSaver;
  };
  const best = [...parsed.data.pools].sort((a, b) =>
    seats(b) > seats(a) ? 1 : seats(b) < seats(a) ? -1 : 0,
  )[0];
  if (!best) {
    report(
      'fail',
      'Open pool',
      'no open pool: create one with pnpm solana:demo-pool',
    );
    return;
  }
  ctx.pool = best;
  const name = best.metadata?.name ?? short(best.address);
  const left = seats(best);
  report(
    left === 0n ? 'fail' : left < LOW_SEATS ? 'warn' : 'pass',
    'Open pool',
    `"${name}" (${best.address}) has match left for about ${left} savers at the cap${left < LOW_SEATS ? ': add budget with fund_match' : ''}`,
  );
  if (best.endsAt * 1_000 < ctx.until) {
    report(
      'warn',
      'Pool window',
      `closes ${new Date(best.endsAt * 1_000).toISOString()}, before ${new Date(ctx.until).toISOString()}`,
    );
  } else {
    report(
      'pass',
      'Pool window',
      `open until ${new Date(best.endsAt * 1_000).toISOString().slice(0, 10)}`,
    );
  }
  const activity = await http(
    `${ctx.app}/api/pools/${best.address}/activity?limit=1`,
  );
  report(
    activity?.status === 200 ? 'pass' : 'fail',
    'Database',
    activity?.status === 200
      ? 'activity feed answers'
      : `activity feed answered ${activity?.status ?? 'nothing'} (${errorCode(activity?.body)}); a Neon database may need waking`,
  );
}

async function checkPrice(ctx: Context): Promise<void> {
  const response = await http(`${ctx.app}/api/price`);
  const parsed = priceSchema.safeParse(response?.body);
  if (parsed.success) {
    const age = Math.round(Date.now() / 1_000 - parsed.data.publishTime);
    report(
      'pass',
      'Pyth price',
      `${parsed.data.pair} $${Number(parsed.data.price).toFixed(2)}, ${age}s old`,
    );
  } else if (response?.status === 404) {
    report(
      'warn',
      'Pyth price',
      'no PYTH_API_KEY on this deployment: "≈ $" values are hidden',
    );
  } else {
    report(
      'warn',
      'Pyth price',
      `unavailable (${response?.status ?? 'no answer'}): the key is set but Hermes refused it or the price was stale. Vercel logs say which ("pyth hermes answered" or "pyth price refused")`,
    );
  }
}

async function checkPages(ctx: Context): Promise<void> {
  const pools = await http(`${ctx.app}/en/pools`);
  if (pools?.status !== 200) {
    report(
      'fail',
      'Pools page',
      `/en/pools answered ${pools?.status ?? 'nothing'}`,
    );
  } else {
    report(
      pools.text.includes(DISCLAIMER) ? 'pass' : 'warn',
      'Pools page',
      pools.text.includes(DISCLAIMER)
        ? 'renders, with the demo disclaimer'
        : 'renders, but the demo disclaimer is missing',
    );
    const framing = pools.headers.get('x-frame-options');
    report(
      framing ? 'pass' : 'warn',
      'Security headers',
      framing
        ? `framing refused (${framing}), nosniff ${pools.headers.get('x-content-type-options') ?? 'missing'}`
        : 'not on this build yet: deploy the current next.config.ts',
    );
  }
  // Someone who opens the bare app URL lands on the staff sign-in; it must lead them on.
  const signIn = await http(`${ctx.app}/`);
  report(
    signIn?.text.includes('/en/pools') ? 'pass' : 'warn',
    'App root',
    signIn?.text.includes('/en/pools')
      ? 'the staff sign-in links on to the pools'
      : 'the staff sign-in has no way on to the pools on this build',
  );
  const web = await http(`${ctx.web}/en`);
  const linksApp = web?.text.includes(`${ctx.app}/en/pools`) ?? false;
  report(
    web?.status === 200 && linksApp ? 'pass' : 'warn',
    'Marketing site',
    web?.status === 200
      ? linksApp
        ? `${ctx.web} links to the app`
        : `${ctx.web} does not link to ${ctx.app}/en/pools`
      : `${ctx.web} answered ${web?.status ?? 'nothing'}`,
  );
}

async function checkRepo(repo: string | null): Promise<void> {
  if (!repo) {
    report('warn', 'Repository', 'no GitHub origin found; pass --repo');
    return;
  }
  // Anonymous, like a judge: a private repository answers 404.
  const response = await http(`https://github.com/${repo}`, {
    method: 'HEAD',
  });
  report(
    response?.status === 200 ? 'pass' : 'fail',
    'Repository',
    response?.status === 200
      ? `github.com/${repo} is public`
      : `github.com/${repo} answers ${response?.status ?? 'nothing'} to a visitor: judges cannot open it`,
  );
}

// ---- --live: a real saver round trip ----

async function recordActivity(app: string, signature: string): Promise<void> {
  // The server re-reads the transaction from its own RPC, which may lag a moment behind ours.
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const response = await postJson(`${app}/api/activity`, { signature });
    if (response?.status === 200) return;
    const code = errorCode(response?.body);
    if (code !== 'transaction_not_found') {
      throw new Error(
        `/api/activity refused ${short(signature)}: ${response?.status ?? 'no answer'} ${code}`,
      );
    }
    await sleep(2_000);
  }
  throw new Error(`/api/activity never found ${short(signature)}`);
}

async function position(
  app: string,
  pool: string,
  wallet: PublicKey,
): Promise<z.infer<typeof positionSchema> | null> {
  const response = await http(
    `${app}/api/pools/${pool}?wallet=${wallet.toBase58()}`,
  );
  const parsed = poolDetailSchema.safeParse(response?.body);
  if (!parsed.success) {
    throw new Error(
      `/api/pools/${short(pool)} answered ${response?.status ?? 'nothing'}`,
    );
  }
  return parsed.data.position;
}

async function timed<T>(label: string, run: () => Promise<T>): Promise<T> {
  const started = Date.now();
  const value = await run();
  report(
    'pass',
    label,
    `${((Date.now() - started) / 1_000).toFixed(1)}s on the live network`,
  );
  return value;
}

async function liveRoundTrip(ctx: Context, rpc: string): Promise<void> {
  const deployment = ctx.deployment;
  const pool = ctx.pool;
  if (!deployment?.faucet || !deployment.allowedMint || !deployment.issuer) {
    report(
      'fail',
      'Live round trip',
      'skipped: needs the faucet and an allowed mint',
    );
    return;
  }
  if (!pool) {
    report('fail', 'Live round trip', 'skipped: no open pool');
    return;
  }
  if (deployment.network === 'mainnet-beta') {
    report('fail', 'Live round trip', 'refused: never on mainnet');
    return;
  }
  const { issuer } = deployment;

  const connection = new Connection(rpc, 'confirmed');
  const saver = Keypair.generate();
  const programId = new PublicKey(deployment.programId);
  const mint = new PublicKey(deployment.allowedMint);
  const poolAddress = new PublicKey(pool.address);
  const program = createMatchPoolsProgram(
    new AnchorProvider(connection, new Wallet(saver), {
      commitment: 'confirmed',
    }),
    programId,
  );
  const accounts = {
    saver: saver.publicKey,
    pool: poolAddress,
    position: positionPda(programId, poolAddress, saver.publicKey),
    mint,
    vault: vaultPda(programId, poolAddress),
    saverTokenAccount: getAssociatedTokenAddressSync(
      mint,
      saver.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
    ),
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  };
  console.log(
    `\n  Live round trip as throwaway wallet ${saver.publicKey.toBase58()} in "${pool.metadata?.name ?? pool.address}"`,
  );

  try {
    const drip = await timed('Faucet', async () => {
      const response = await postJson(`${ctx.app}/api/faucet`, {
        wallet: saver.publicKey.toBase58(),
      });
      const parsed = dripSchema.safeParse(response?.body);
      if (!parsed.success) {
        throw new Error(
          `faucet answered ${response?.status ?? 'nothing'} (${errorCode(response?.body)})`,
        );
      }
      return parsed.data;
    });

    // A tenth of what the faucet sent, within the cap, so the run barely touches the budget.
    const capped =
      BigInt(drip.tokensRaw) < BigInt(pool.perSaverCap)
        ? BigInt(drip.tokensRaw)
        : BigInt(pool.perSaverCap);
    const amount = capped / 10n;
    const unreserved = BigInt(pool.unreserved);
    const wanted = (amount * BigInt(pool.matchBps)) / 10_000n;
    const expectedMatch = wanted < unreserved ? wanted : unreserved;
    const shown = (raw: bigint) =>
      rawToUi(raw, issuer.decimals, issuer.multiplier, 4);

    await timed('Deposit', async () => {
      const signature = await program.methods
        .deposit(new BN(amount.toString()), new BN(expectedMatch.toString()))
        .accountsPartial({
          ...accounts,
          systemProgram: SystemProgram.programId,
        })
        .signers([saver])
        .rpc();
      await recordActivity(ctx.app, signature);
    });
    const deposited = await position(ctx.app, pool.address, saver.publicKey);
    if (
      !deposited ||
      BigInt(deposited.deposited) !== amount ||
      BigInt(deposited.matchReserved) !== expectedMatch
    ) {
      throw new Error(
        `the API shows ${JSON.stringify(deposited)} after depositing ${amount}`,
      );
    }
    report(
      'pass',
      'Match reserved',
      `${shown(amount)} deposited, ${shown(expectedMatch)} match reserved, read back through the API`,
    );

    // Let some of the match vest, then take it.
    await sleep(Math.min(20, Math.max(5, pool.vestingSeconds / 20)) * 1_000);
    await timed('Claim', async () => {
      const signature = await program.methods
        .claimVested()
        .accountsPartial(accounts)
        .signers([saver])
        .rpc();
      await recordActivity(ctx.app, signature);
    });
    await timed('Withdraw early', async () => {
      const signature = await program.methods
        .withdraw()
        .accountsPartial(accounts)
        .signers([saver])
        .rpc();
      await recordActivity(ctx.app, signature);
    });
    const settled = await position(ctx.app, pool.address, saver.publicKey);
    if (!settled?.settled) {
      throw new Error('the position is not settled after withdrawing');
    }
    report(
      'pass',
      'Forfeiture',
      `kept ${shown(BigInt(settled.matchReserved))} vested match, ${shown(expectedMatch - BigInt(settled.matchReserved))} went back to the sponsor`,
    );
    await timed('Close', async () => {
      if (BigInt(settled.matchReserved) > BigInt(settled.matchClaimed)) {
        const signature = await program.methods
          .claimVested()
          .accountsPartial(accounts)
          .signers([saver])
          .rpc();
        await recordActivity(ctx.app, signature);
      }
      const signature = await program.methods
        .closePosition()
        .accountsPartial({
          saver: saver.publicKey,
          pool: poolAddress,
          position: accounts.position,
        })
        .signers([saver])
        .rpc();
      await recordActivity(ctx.app, signature);
    });
    if ((await position(ctx.app, pool.address, saver.publicKey)) !== null) {
      throw new Error('the position still exists after closing');
    }
  } catch (error) {
    report(
      'fail',
      'Live round trip',
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  const trim = (url: string) => url.replace(/\/+$/, '');
  const until = Date.parse(flags.get('until') ?? DEFAULT_UNTIL);
  if (Number.isNaN(until)) throw new Error('--until is not a date');
  const ctx: Context = {
    app: trim(flags.get('app') ?? DEFAULT_APP),
    web: trim(flags.get('web') ?? DEFAULT_WEB),
    until,
    deployment: null,
    pool: null,
  };

  console.log(
    `AquaStock demo pre-flight · ${ctx.app} · ${new Date().toISOString()}\n`,
  );
  await checkBuild(ctx);
  await checkDeployment(ctx);
  const rpc =
    flags.get('rpc') ??
    process.env.SOLANA_RPC_URL ??
    (ctx.deployment ? PUBLIC_RPC[ctx.deployment.network] : undefined);
  await checkFaucetBalance(ctx, flags.get('faucet'), rpc);
  await checkPools(ctx);
  await checkPrice(ctx);
  await checkPages(ctx);
  await checkRepo(flags.get('repo') ?? repoFromOrigin());

  if (flags.has('live')) {
    if (!rpc) {
      report('fail', 'Live round trip', 'no RPC for this network: pass --rpc');
    } else {
      await liveRoundTrip(ctx, rpc);
    }
  }

  const failed = results.filter((status) => status === 'fail').length;
  const warned = results.filter((status) => status === 'warn').length;
  console.log(
    `\n${failed === 0 ? 'READY' : 'NOT READY'}: ${failed} failed, ${warned} warnings${flags.has('live') ? '' : ' (add --live for a real round trip on the network)'}`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
