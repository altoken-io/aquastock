// Allow-lists the one mint this deployment accepts. Only the program's upgrade
// authority can do this, and only once.
//   pnpm exec tsx scripts/solana/init-config.ts --mint <mint> --program <id> --wallet <keypair.json>
import { AnchorProvider, Wallet } from '@anchor-lang/core';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram } from '@solana/web3.js';

import { configPda, programDataPda } from '../../apps/dapp/src/lib/solana/pdas';
import { createMatchPoolsProgram } from '../../apps/dapp/src/lib/solana/program';
import { context, requirePublicKey } from './lib';

async function main(): Promise<void> {
  const { flags, connection, wallet } = context(process.argv.slice(2));
  const programId = requirePublicKey(
    flags,
    'program',
    'NEXT_PUBLIC_ANCHOR_PROGRAM_ID',
  );
  const mint = requirePublicKey(flags, 'mint', 'NEXT_PUBLIC_STOCK_MINT');

  const provider = new AnchorProvider(connection, new Wallet(wallet), {
    commitment: 'confirmed',
  });
  const program = createMatchPoolsProgram(provider, programId);

  const signature = await program.methods
    .initConfig()
    .accountsPartial({
      authority: wallet.publicKey,
      config: configPda(programId),
      mint,
      program: programId,
      programData: programDataPda(programId),
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log(`config initialised for mint ${mint.toBase58()}`);
  console.log(`transaction: ${signature}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
