// Mints demo replica tokens to a wallet (creating its token account if needed).
//   pnpm exec tsx scripts/solana/mint-replica.ts --mint <mint> --to <wallet> --amount 100
// The signing wallet must be the mint authority, which `replica-mint.ts` sets to itself.
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  getScaledUiAmountConfig,
} from '@solana/spl-token';
import { Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

import { multiplierToString } from '../../apps/dapp/src/lib/pools/chain';
import { uiToRaw } from '../../apps/dapp/src/lib/solana/amounts';
import { context, requirePublicKey } from './lib';

async function main(): Promise<void> {
  const { flags, connection, wallet } = context(process.argv.slice(2));
  const mint = requirePublicKey(flags, 'mint', 'NEXT_PUBLIC_STOCK_MINT');
  const to = requirePublicKey(flags, 'to');
  const amount = flags.get('amount');
  if (!amount)
    throw new Error('missing --amount (tokens, for example 100 or 12.5)');

  const mintInfo = await getMint(
    connection,
    mint,
    'confirmed',
    TOKEN_2022_PROGRAM_ID,
  );
  const { decimals } = mintInfo;
  const scaled = getScaledUiAmountConfig(mintInfo);
  // The amount is what a wallet shows, so convert through the display multiplier.
  const raw = uiToRaw(
    amount,
    decimals,
    scaled ? multiplierToString(scaled.multiplier) : '1',
    'up',
  );
  const ata = getAssociatedTokenAddressSync(
    mint,
    to,
    true,
    TOKEN_2022_PROGRAM_ID,
  );

  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        ata,
        to,
        mint,
        TOKEN_2022_PROGRAM_ID,
      ),
      createMintToCheckedInstruction(
        mint,
        ata,
        wallet.publicKey,
        raw,
        decimals,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    ),
    [wallet],
  );
  console.log(
    `minted ${amount} to ${to.toBase58()} (token account ${ata.toBase58()})`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
