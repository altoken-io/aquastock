// Creates or tops up the demo faucet wallet that `POST /api/faucet` sends from. It is a
// dedicated hot wallet holding only demo tokens and a little SOL, never the deployer, the
// upgrade authority or the mint authority. Safe to re-run: it only adds what is missing.
//
//   pnpm solana:faucet --rpc <url> --mint <mint> [--faucet programs/keys/faucet-devnet.json] \
//     [--sol 1] [--tokens 100000]
//
// The signing wallet (--wallet, default ~/.config/solana/id.json) pays the SOL and must be the
// replica mint's authority. The faucet's secret is written to the keypair file (mode 600) and
// is never printed: put that file's contents in FAUCET_SECRET_KEY yourself.
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import { multiplierToString } from '../../apps/dapp/src/lib/pools/chain';
import { uiToRaw } from '../../apps/dapp/src/lib/solana/amounts';
import { context, loadKeypair, requirePublicKey } from './lib';

const MAINNET_GENESIS = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

async function main(): Promise<void> {
  const { flags, connection, wallet } = context(process.argv.slice(2));
  if ((await connection.getGenesisHash()) === MAINNET_GENESIS) {
    throw new Error('refusing to run a faucet on mainnet');
  }
  const mint = requirePublicKey(flags, 'mint', 'NEXT_PUBLIC_STOCK_MINT');
  const path = resolve(
    flags.get('faucet') ?? 'programs/keys/faucet-devnet.json',
  );
  const targetSol = Number(flags.get('sol') ?? 1);
  const targetTokens = flags.get('tokens') ?? '100000';
  if (!(targetSol > 0 && targetSol <= 5)) {
    throw new Error('--sol must be between 0 and 5');
  }

  let faucet: Keypair;
  if (existsSync(path)) {
    faucet = loadKeypair(path);
  } else {
    faucet = Keypair.generate();
    writeFileSync(path, JSON.stringify(Array.from(faucet.secretKey)), {
      mode: 0o600,
      flag: 'wx',
    });
    console.error(`created faucet keypair at ${path}`);
  }
  if (faucet.publicKey.equals(wallet.publicKey)) {
    throw new Error(
      'the faucet must be its own wallet, not the signing wallet',
    );
  }

  const tx = new Transaction();

  const targetLamports = BigInt(Math.round(targetSol * LAMPORTS_PER_SOL));
  const lamports = BigInt(await connection.getBalance(faucet.publicKey));
  if (lamports < targetLamports) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: faucet.publicKey,
        lamports: targetLamports - lamports,
      }),
    );
  }

  const mintInfo = await getMint(
    connection,
    mint,
    'confirmed',
    TOKEN_2022_PROGRAM_ID,
  );
  const scaled = getScaledUiAmountConfig(mintInfo);
  const targetRaw = uiToRaw(
    targetTokens,
    mintInfo.decimals,
    scaled ? multiplierToString(scaled.multiplier) : '1',
    'up',
  );
  const ata = getAssociatedTokenAddressSync(
    mint,
    faucet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
  );
  const existing = await connection.getAccountInfo(ata);
  const heldRaw = existing
    ? BigInt((await connection.getTokenAccountBalance(ata)).value.amount)
    : 0n;
  if (heldRaw < targetRaw) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        ata,
        faucet.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID,
      ),
      createMintToCheckedInstruction(
        mint,
        ata,
        wallet.publicKey,
        targetRaw - heldRaw,
        mintInfo.decimals,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    );
  }

  const signature =
    tx.instructions.length > 0
      ? await sendAndConfirmTransaction(connection, tx, [wallet], {
          commitment: 'confirmed',
        })
      : null;

  console.log(
    JSON.stringify(
      {
        faucet: faucet.publicKey.toBase58(),
        keypairFile: path,
        sol: targetSol,
        tokens: targetTokens,
        signature,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
