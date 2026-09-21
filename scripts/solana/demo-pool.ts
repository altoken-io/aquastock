// Creates a demo pool for the demo, the dev server and the golden-path test: an optional
// replica mint, the allow-list config, a funded pool, and optionally a deposit from a
// throwaway saver. Prints one JSON object with every address and transaction signature.
//
//   pnpm exec tsx scripts/solana/demo-pool.ts --rpc <url> --wallet <keypair.json> \
//     --program <id> [--mint <mint>] [--vesting 180] [--window 3600] [--budget 1000] \
//     [--cap 100] [--with-saver 40]
//
// The wallet is the sponsor and the mint's issuer. `--with-saver` airdrops SOL to a fresh
// saver, so use it on a local validator or devnet only.
import { AnchorProvider, BN, Wallet } from '@anchor-lang/core';
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  getScaledUiAmountConfig,
} from '@solana/spl-token';
import {
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import { uiToRaw } from '../../apps/dapp/src/lib/solana/amounts';
import {
  configPda,
  poolPda,
  positionPda,
  programDataPda,
  vaultPda,
} from '../../apps/dapp/src/lib/solana/pdas';
import { createMatchPoolsProgram } from '../../apps/dapp/src/lib/solana/program';
import { context, requirePublicKey } from './lib';
import { multiplierToString } from '../../apps/dapp/src/lib/pools/chain';
import { createReplicaMint, REPLICA_DECIMALS } from './replica';

const number = (
  flags: Map<string, string>,
  name: string,
  fallback: number,
): number => {
  const value = Number(flags.get(name) ?? fallback);
  if (!Number.isInteger(value) || value <= 0)
    throw new Error(`--${name} must be a positive integer`);
  return value;
};

async function main(): Promise<void> {
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
  const bn = (value: bigint): BN => new BN(value.toString());

  const vesting = number(flags, 'vesting', 180);
  const window = number(flags, 'window', 3_600);
  const budget = number(flags, 'budget', 1_000);
  const cap = number(flags, 'cap', 100);

  const mint = flags.has('mint')
    ? requirePublicKey(flags, 'mint')
    : await createReplicaMint(connection, wallet);
  const signatures: Record<string, string> = {};

  // Amounts here are what a wallet shows, so convert through the mint's display multiplier.
  const scaled = getScaledUiAmountConfig(
    await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID),
  );
  const multiplier = scaled ? multiplierToString(scaled.multiplier) : '1';
  const tokens = (amount: number): bigint =>
    uiToRaw(String(amount), REPLICA_DECIMALS, multiplier, 'up');

  const configAddress = configPda(programId);
  if ((await connection.getAccountInfo(configAddress)) === null) {
    signatures.initConfig = await program.methods
      .initConfig()
      .accountsPartial({
        authority: wallet.publicKey,
        config: configAddress,
        mint,
        program: programId,
        programData: programDataPda(programId),
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  const sponsorAta = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
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
      createMintToCheckedInstruction(
        mint,
        sponsorAta,
        wallet.publicKey,
        tokens(budget),
        REPLICA_DECIMALS,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    ),
    [wallet],
  );

  const poolId = BigInt(Date.now());
  const pool = poolPda(programId, wallet.publicKey, poolId);
  const vault = vaultPda(programId, pool);
  const now =
    (await connection.getBlockTime(await connection.getSlot('confirmed'))) ??
    Math.floor(Date.now() / 1000);

  signatures.createPool = await program.methods
    .createPool({
      poolId: bn(poolId),
      matchBps: 10_000,
      perSaverCap: bn(tokens(cap)),
      vestingSeconds: new BN(vesting),
      endsAt: new BN(now + window),
    })
    .accountsPartial({
      sponsor: wallet.publicKey,
      mint,
      config: configAddress,
      pool,
      vault,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  signatures.fundMatch = await program.methods
    .fundMatch(bn(tokens(budget)))
    .accountsPartial({
      sponsor: wallet.publicKey,
      pool,
      mint,
      vault,
      sponsorTokenAccount: sponsorAta,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();

  const result: Record<string, unknown> = {
    programId: programId.toBase58(),
    mint: mint.toBase58(),
    sponsor: wallet.publicKey.toBase58(),
    pool: pool.toBase58(),
    poolId: poolId.toString(),
    vault: vault.toBase58(),
    vestingSeconds: vesting,
    endsAt: now + window,
    signatures,
  };

  if (flags.has('with-saver')) {
    const amount = number(flags, 'with-saver', 40);
    const saver = Keypair.generate();
    await connection.confirmTransaction(
      await connection.requestAirdrop(saver.publicKey, 2_000_000_000),
      'confirmed',
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
          saverAta,
          saver.publicKey,
          mint,
          TOKEN_2022_PROGRAM_ID,
        ),
        createMintToCheckedInstruction(
          mint,
          saverAta,
          wallet.publicKey,
          tokens(amount),
          REPLICA_DECIMALS,
          [],
          TOKEN_2022_PROGRAM_ID,
        ),
      ),
      [wallet],
    );
    signatures.deposit = await program.methods
      .deposit(bn(tokens(amount)), new BN(0))
      .accountsPartial({
        saver: saver.publicKey,
        pool,
        position: positionPda(programId, pool, saver.publicKey),
        mint,
        vault,
        saverTokenAccount: saverAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([saver])
      .rpc();
    result.saver = saver.publicKey.toBase58();
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
