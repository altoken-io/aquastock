// End-to-end run of the whole product flow on a real validator, through the same typed
// client the dApp uses. Takes about a minute because vesting runs on the chain's clock.
//   pnpm program:smoke
import { AnchorProvider, BN, Wallet } from '@anchor-lang/core';
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import {
  configPda,
  poolPda,
  positionPda,
  programDataPda,
  vaultPda,
} from '../../apps/dapp/src/lib/solana/pdas';
import { createMatchPoolsProgram } from '../../apps/dapp/src/lib/solana/program';
import { context, requirePublicKey, sleep } from './lib';
import { createReplicaMint, REPLICA_DECIMALS } from './replica';

async function main(): Promise<void> {
  const ONE = 10n ** BigInt(REPLICA_DECIMALS);
  const VESTING_SECONDS = 30;

  const { flags, connection, wallet } = context(process.argv.slice(2));
  const programId = requirePublicKey(
    flags,
    'program',
    'NEXT_PUBLIC_ANCHOR_PROGRAM_ID',
  );
  const program = createMatchPoolsProgram(
    new AnchorProvider(connection, new Wallet(wallet), {
      commitment: 'confirmed',
    }),
    programId,
  );

  const big = (value: { toString(): string }): bigint =>
    BigInt(value.toString());
  const bn = (value: bigint): BN => new BN(value.toString());
  const step = (message: string): void => console.log(`  ✓ ${message}`);

  function assertEqual(label: string, actual: bigint, expected: bigint): void {
    if (actual !== expected) {
      throw new Error(`${label}: expected ${expected}, got ${actual}`);
    }
  }

  async function chainTime(): Promise<number> {
    const time = await connection.getBlockTime(
      await connection.getSlot('confirmed'),
    );
    if (time === null) throw new Error('no block time yet');
    return time;
  }

  async function waitUntil(target: number): Promise<void> {
    while ((await chainTime()) < target) await sleep(1_000);
  }

  async function balance(account: PublicKey): Promise<bigint> {
    return (
      await getAccount(connection, account, 'confirmed', TOKEN_2022_PROGRAM_ID)
    ).amount;
  }

  async function expectRejected(
    expected: string,
    run: Promise<unknown>,
  ): Promise<void> {
    try {
      await run;
    } catch (error) {
      const text = String(error instanceof Error ? error.message : error);
      if (text.includes(expected)) return;
      throw new Error(`expected ${expected}, got: ${text}`);
    }
    throw new Error(`expected ${expected}, but the call succeeded`);
  }

  console.log(`program ${programId.toBase58()} on ${connection.rpcEndpoint}`);

  // ---- setup: a replica mint, one sponsor (the wallet), one saver ----
  const saver = Keypair.generate();
  await connection.confirmTransaction(
    await connection.requestAirdrop(saver.publicKey, 2_000_000_000),
    'confirmed',
  );
  const mint = await createReplicaMint(connection, wallet);
  step(`replica mint ${mint.toBase58()}`);

  const sponsorAta = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
  );
  const saverAta = getAssociatedTokenAddressSync(
    mint,
    saver.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
  );
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        sponsorAta,
        wallet.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID,
      ),
      createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        saverAta,
        saver.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID,
      ),
      createMintToCheckedInstruction(
        mint,
        sponsorAta,
        wallet.publicKey,
        1_000n * ONE,
        REPLICA_DECIMALS,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
      createMintToCheckedInstruction(
        mint,
        saverAta,
        wallet.publicKey,
        100n * ONE,
        REPLICA_DECIMALS,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    ),
    [wallet],
  );
  step('token accounts funded');

  // ---- allow-list the mint, then create and fund a pool ----
  const config = configPda(programId);
  await program.methods
    .initConfig()
    .accountsPartial({
      authority: wallet.publicKey,
      config,
      mint,
      program: programId,
      programData: programDataPda(programId),
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  step('config initialised (upgrade authority signed)');

  const poolId = BigInt(Date.now());
  const pool = poolPda(programId, wallet.publicKey, poolId);
  const vault = vaultPda(programId, pool);
  const position = positionPda(programId, pool, saver.publicKey);
  const startedNear = await chainTime();
  const endsAt = startedNear + 50;

  await program.methods
    .createPool({
      poolId: bn(poolId),
      matchBps: 10_000,
      perSaverCap: bn(100n * ONE),
      vestingSeconds: new BN(VESTING_SECONDS),
      endsAt: new BN(endsAt),
    })
    .accountsPartial({
      sponsor: wallet.publicKey,
      mint,
      config,
      pool,
      vault,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  step('pool created');

  await program.methods
    .fundMatch(bn(200n * ONE))
    .accountsPartial({
      sponsor: wallet.publicKey,
      pool,
      mint,
      vault,
      sponsorTokenAccount: sponsorAta,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();
  assertEqual('vault after funding', await balance(vault), 200n * ONE);
  step('match budget funded: 200');

  // ---- the saver deposits ----
  const depositAccounts = {
    saver: saver.publicKey,
    pool,
    position,
    mint,
    vault,
    saverTokenAccount: saverAta,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  };
  await expectRejected(
    'DepositExceedsCap',
    program.methods
      .deposit(bn(101n * ONE), new BN(0))
      .accountsPartial(depositAccounts)
      .signers([saver])
      .rpc(),
  );
  step('over-cap deposit rejected with a readable error');

  await program.methods
    .deposit(bn(40n * ONE), bn(40n * ONE))
    .accountsPartial(depositAccounts)
    .signers([saver])
    .rpc();
  const afterDeposit = await program.account.position.fetch(position);
  assertEqual('deposited', big(afterDeposit.deposited), 40n * ONE);
  assertEqual('match reserved', big(afterDeposit.matchReserved), 40n * ONE);
  assertEqual('vault after deposit', await balance(vault), 240n * ONE);
  assertEqual('saver after deposit', await balance(saverAta), 60n * ONE);
  step('deposited 40, matched 40 (1:1), reserved on-chain');

  // ---- the match vests over time; claim part of it ----
  await waitUntil(
    big(afterDeposit.startedAt) > 0n
      ? Number(afterDeposit.startedAt) + 12
      : startedNear + 12,
  );
  const claimAccounts = {
    saver: saver.publicKey,
    pool,
    position,
    mint,
    vault,
    saverTokenAccount: saverAta,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  };
  const beforeClaim = await chainTime();
  await program.methods
    .claimVested()
    .accountsPartial(claimAccounts)
    .signers([saver])
    .rpc();
  const afterClaim = await chainTime();
  const claimed = big(
    (await program.account.position.fetch(position)).matchClaimed,
  );
  const started = Number(afterDeposit.startedAt);
  const floor =
    (40n * ONE * BigInt(beforeClaim - started)) / BigInt(VESTING_SECONDS);
  const ceiling =
    (40n * ONE * BigInt(afterClaim - started)) / BigInt(VESTING_SECONDS);
  if (claimed <= 0n || claimed < floor || claimed > ceiling) {
    throw new Error(
      `claim ${claimed} outside the vested range ${floor}..${ceiling}`,
    );
  }
  assertEqual(
    'saver paid the claim',
    await balance(saverAta),
    60n * ONE + claimed,
  );
  step(
    `claimed ${claimed} raw units of vested match (between ${floor} and ${ceiling})`,
  );

  // ---- leaving early forfeits the unvested match ----
  await program.methods
    .withdraw()
    .accountsPartial(claimAccounts)
    .signers([saver])
    .rpc();
  const settled = await program.account.position.fetch(position);
  if (!settled.settled) throw new Error('position should be settled');
  assertEqual(
    'principal returned',
    await balance(saverAta),
    100n * ONE + claimed,
  );
  const reserved = big(settled.matchReserved);
  if (reserved >= 40n * ONE) throw new Error('nothing was forfeited');
  step(
    `withdrew: principal back in full, ${40n * ONE - reserved} of the match forfeited`,
  );

  // ---- after the window the sponsor reclaims what nobody has a claim on ----
  await waitUntil(endsAt + 1);
  const poolBefore = await program.account.pool.fetch(pool);
  const sponsorBefore = await balance(sponsorAta);
  await program.methods
    .reclaimUnmatched()
    .accountsPartial({
      sponsor: wallet.publicKey,
      pool,
      mint,
      vault,
      sponsorTokenAccount: sponsorAta,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();
  assertEqual(
    'sponsor reclaimed',
    (await balance(sponsorAta)) - sponsorBefore,
    big(poolBefore.budgetTotal) - big(poolBefore.reserved),
  );
  step('sponsor reclaimed the unreserved budget');

  // ---- the saver collects what had vested and closes the position ----
  if (reserved > claimed) {
    await program.methods
      .claimVested()
      .accountsPartial(claimAccounts)
      .signers([saver])
      .rpc();
  }
  await program.methods
    .closePosition()
    .accountsPartial({ saver: saver.publicKey, pool, position })
    .signers([saver])
    .rpc();
  if ((await connection.getAccountInfo(position)) !== null) {
    throw new Error('position should be closed');
  }
  assertEqual('vault is empty', await balance(vault), 0n);
  step('final claim paid, position closed, vault empty');

  console.log('SMOKE OK');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
