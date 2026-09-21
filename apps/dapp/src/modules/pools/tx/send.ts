// Signs, sends and confirms one transaction. The person's wallet does the signing; this only
// builds a v0 message with a fresh blockhash and waits for `confirmed`.
import type { WalletContextState } from '@solana/wallet-adapter-react';
import {
  TransactionMessage,
  VersionedTransaction,
  type Connection,
  type TransactionInstruction,
} from '@solana/web3.js';

import { TransactionFailedError } from '../lib/tx-errors';

export class WalletNotConnectedError extends Error {
  constructor() {
    super('Wallet not connected');
    this.name = 'WalletNotConnectedError';
  }
}

export async function sendInstructions({
  connection,
  wallet,
  instructions,
  onSent,
}: {
  connection: Connection;
  wallet: Pick<WalletContextState, 'publicKey' | 'sendTransaction'>;
  instructions: TransactionInstruction[];
  /** Called with the signature as soon as the wallet has sent it, before confirmation. */
  onSent?: (signature: string) => void;
}): Promise<string> {
  const { publicKey } = wallet;
  if (!publicKey) throw new WalletNotConnectedError();

  const latest = await connection.getLatestBlockhash('confirmed');
  const message = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latest.blockhash,
    instructions,
  }).compileToV0Message();

  // Preflight stays on: a doomed transaction is refused with the program's own error code
  // instead of costing the person a fee.
  const signature = await wallet.sendTransaction(
    new VersionedTransaction(message),
    connection,
    { preflightCommitment: 'confirmed' },
  );
  onSent?.(signature);

  const result = await connection.confirmTransaction(
    {
      signature,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    'confirmed',
  );
  if (result.value.err) {
    throw new TransactionFailedError(result.value.err, signature);
  }
  return signature;
}
