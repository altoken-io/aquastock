// Creates the demo replica of the SPYx mint and prints its address.
//   pnpm exec tsx scripts/solana/replica-mint.ts --rpc <url> --wallet <keypair.json>
import { context } from './lib';
import { createReplicaMint, DEFAULT_REPLICA } from './replica';

async function main(): Promise<void> {
  const { flags, connection, wallet } = context(process.argv.slice(2));
  const mint = await createReplicaMint(connection, wallet, {
    ...DEFAULT_REPLICA,
    name: flags.get('name') ?? DEFAULT_REPLICA.name,
    symbol: flags.get('symbol') ?? DEFAULT_REPLICA.symbol,
  });
  console.log(`replica mint: ${mint.toBase58()}`);
  console.log(`issuer (all authorities): ${wallet.publicKey.toBase58()}`);
  console.log('Set NEXT_PUBLIC_STOCK_MINT to the mint address above.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
