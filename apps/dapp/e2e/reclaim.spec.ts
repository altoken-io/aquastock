import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AnchorProvider, BN, Wallet } from '@anchor-lang/core';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMint,
  getScaledUiAmountConfig,
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { expect, test } from '@playwright/test';

import { multiplierToString } from '../src/lib/pools/chain';
import { uiToRaw } from '../src/lib/solana/amounts';
import { configPda, poolPda, vaultPda } from '../src/lib/solana/pdas';
import { createMatchPoolsProgram } from '../src/lib/solana/program';
import { parseSecretKey } from '../src/modules/wallet/e2e-wallet-adapter';
import { connectTestWallet, dismissCookieBanner, readStack } from './support';

/**
 * The sponsor's last step: once a pool closes, the match nobody reserved comes back. The
 * create-pool form's shortest window is 10 minutes, so this pool is created directly on the
 * validator, sponsored by the browser's test wallet, with a window of seconds. The reclaim
 * itself is clicked in the real UI.
 */
test('the sponsor reclaims unused match once the pool closes', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'desktop',
    'one real on-chain run is enough; the golden path covers the mobile layout',
  );

  const stack = readStack();
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  const secret = parseSecretKey(
    readFileSync(
      join(__dirname, '../../../programs/keys/e2e-wallet.json'),
      'utf8',
    ),
  );
  if (!secret)
    throw new Error('programs/keys/e2e-wallet.json is not a keypair');
  const sponsor = Keypair.fromSecretKey(secret);
  expect(sponsor.publicKey.toBase58()).toBe(stack.wallet);

  const programId = new PublicKey(stack.programId);
  const mint = new PublicKey(stack.mint);
  const program = createMatchPoolsProgram(
    new AnchorProvider(connection, new Wallet(sponsor), {
      commitment: 'confirmed',
    }),
    programId,
  );
  const scaled = getScaledUiAmountConfig(
    await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID),
  );
  const raw = (tokens: string) =>
    uiToRaw(
      tokens,
      8,
      scaled ? multiplierToString(scaled.multiplier) : '1',
      'up',
    );
  const bn = (value: bigint) => new BN(value.toString());
  const sponsorAta = getAssociatedTokenAddressSync(
    mint,
    sponsor.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
  );
  const balance = async () =>
    BigInt((await connection.getTokenAccountBalance(sponsorAta)).value.amount);

  // ---- A pool that closes in seconds, funded and never deposited into --------------------
  const budget = raw('30');
  const poolId = BigInt(Date.now());
  const address = poolPda(programId, sponsor.publicKey, poolId);
  const vault = vaultPda(programId, address);
  const chainNow = async () =>
    (await connection.getBlockTime(await connection.getSlot('confirmed'))) ??
    Math.floor(Date.now() / 1000);
  const endsAt = (await chainNow()) + 15;

  await program.methods
    .createPool({
      poolId: bn(poolId),
      matchBps: 10_000,
      perSaverCap: bn(raw('10')),
      vestingSeconds: new BN(30),
      endsAt: new BN(endsAt),
    })
    .accountsPartial({
      sponsor: sponsor.publicKey,
      mint,
      config: configPda(programId),
      pool: address,
      vault,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  await program.methods
    .fundMatch(bn(budget))
    .accountsPartial({
      sponsor: sponsor.publicKey,
      pool: address,
      mint,
      vault,
      sponsorTokenAccount: sponsorAta,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();
  const before = await balance();

  // ---- While open, the sponsor is told when reclaim becomes possible ----------------------
  await dismissCookieBanner(page);
  await page.goto(`/en/pools/${address.toBase58()}`);
  await connectTestWallet(page);
  await expect(
    page.getByRole('heading', { name: 'Reclaim unused match' }),
  ).toBeVisible();
  await expect(
    page.getByText(/^Available after the pool closes/),
  ).toBeVisible();

  // ---- After it closes, one click returns the whole budget -------------------------------
  await expect
    .poll(chainNow, { timeout: 60_000, intervals: [1_000] })
    .toBeGreaterThan(endsAt);
  await page.reload();
  await connectTestWallet(page);
  const reclaim = page.getByRole('button', { name: /^Reclaim .+ dSPYx$/ });
  await expect(reclaim).toBeVisible();
  await reclaim.click();
  await expect(
    page.getByText('Reclaimed. The tokens are back in your wallet.'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'View transaction' }),
  ).toBeVisible();

  // The chain agrees: the full budget is back, and the panel has nothing left to offer.
  expect(await balance()).toBe(before + budget);
  await expect(page.getByText('Nothing to reclaim right now.')).toBeVisible();
});
