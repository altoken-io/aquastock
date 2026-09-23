// The faucet's only signing code: one transaction from the faucet wallet that creates the
// recipient's token account if needed, sends demo tokens, and sends SOL for fees.
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

import { fetchIssuerPowers } from '../pools/chain';
import type { FaucetChain } from './service';

/** Under the route's `maxDuration`, so a slow network fails cleanly instead of being killed. */
const CONFIRM_TIMEOUT_MS = 25_000;
const POLL_MS = 700;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Sends a signed transaction and waits for `confirmed` by polling over HTTP. The library's
 * `sendAndConfirmTransaction` confirms over a WebSocket, which a serverless function may not
 * hold open for long; polling needs nothing but the RPC's HTTP endpoint.
 */
async function sendAndPoll(
  connection: Connection,
  tx: Transaction,
  signer: Keypair,
): Promise<string> {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = signer.publicKey;
  tx.sign(signer);
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    preflightCommitment: 'confirmed',
  });

  const deadline = Date.now() + CONFIRM_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const {
      value: [status],
    } = await connection.getSignatureStatuses([signature]);
    if (status?.err) {
      throw new Error(`faucet transaction ${signature} failed on-chain`);
    }
    if (
      status?.confirmationStatus === 'confirmed' ||
      status?.confirmationStatus === 'finalized'
    ) {
      return signature;
    }
    if ((await connection.getBlockHeight('confirmed')) > lastValidBlockHeight) {
      throw new Error(`faucet transaction ${signature} expired unconfirmed`);
    }
    await sleep(POLL_MS);
  }
  throw new Error(`faucet transaction ${signature} not confirmed in time`);
}

export function createFaucetChain(
  connection: Connection,
  faucet: Keypair,
  mint: PublicKey,
): FaucetChain {
  const ata = (owner: PublicKey) =>
    getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);

  return {
    async mint() {
      const facts = await fetchIssuerPowers(
        connection,
        mint,
        Math.floor(Date.now() / 1000),
      );
      return { decimals: facts.decimals, multiplier: facts.multiplier };
    },
    async lamports(owner) {
      return BigInt(await connection.getBalance(owner, 'confirmed'));
    },
    async tokenBalance(owner) {
      const account = ata(owner);
      if ((await connection.getAccountInfo(account, 'confirmed')) === null) {
        return 0n;
      }
      const balance = await connection.getTokenAccountBalance(
        account,
        'confirmed',
      );
      return BigInt(balance.value.amount);
    },
    async send({ recipient, tokensRaw, lamports, decimals }) {
      // A small priority fee keeps the drip from stalling when devnet is busy.
      const tx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
      );
      if (tokensRaw > 0n) {
        const destination = ata(recipient);
        tx.add(
          createAssociatedTokenAccountIdempotentInstruction(
            faucet.publicKey,
            destination,
            recipient,
            mint,
            TOKEN_2022_PROGRAM_ID,
          ),
          createTransferCheckedInstruction(
            ata(faucet.publicKey),
            mint,
            destination,
            faucet.publicKey,
            tokensRaw,
            decimals,
            [],
            TOKEN_2022_PROGRAM_ID,
          ),
        );
      }
      if (lamports > 0n) {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: faucet.publicKey,
            toPubkey: recipient,
            lamports,
          }),
        );
      }
      return sendAndPoll(connection, tx, faucet);
    },
  };
}
