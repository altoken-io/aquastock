// @vitest-environment node
import { Keypair, SystemProgram, type Connection } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { classifyTxError, TransactionFailedError } from '../lib/tx-errors';
import { sendInstructions, WalletNotConnectedError } from './send';

const payer = Keypair.generate().publicKey;
const instruction = SystemProgram.transfer({
  fromPubkey: payer,
  toPubkey: Keypair.generate().publicKey,
  lamports: 1,
});

function fakeConnection(confirmation: { err: unknown }) {
  return {
    getLatestBlockhash: vi.fn(async () => ({
      blockhash: '11111111111111111111111111111111',
      lastValidBlockHeight: 100,
    })),
    confirmTransaction: vi.fn(async () => ({ value: confirmation })),
  } as unknown as Connection;
}

describe('sendInstructions', () => {
  it('sends a v0 transaction paid by the wallet and reports the signature twice-ordered', async () => {
    const connection = fakeConnection({ err: null });
    const sendTransaction = vi.fn(async () => 'SIG');
    const onSent = vi.fn();
    const signature = await sendInstructions({
      connection,
      wallet: { publicKey: payer, sendTransaction },
      instructions: [instruction],
      onSent,
    });
    expect(signature).toBe('SIG');
    expect(onSent).toHaveBeenCalledWith('SIG');
    const [sent, , options] = sendTransaction.mock.calls[0] as unknown as [
      { version: string | number; message: { staticAccountKeys: unknown[] } },
      unknown,
      { preflightCommitment: string },
    ];
    expect(sent.version).toBe(0);
    expect(options.preflightCommitment).toBe('confirmed');
  });

  it('refuses without a connected wallet, before asking for anything', async () => {
    const connection = fakeConnection({ err: null });
    await expect(
      sendInstructions({
        connection,
        wallet: { publicKey: null, sendTransaction: vi.fn() },
        instructions: [instruction],
      }),
    ).rejects.toBeInstanceOf(WalletNotConnectedError);
    expect(connection.getLatestBlockhash).not.toHaveBeenCalled();
  });

  it('turns a transaction that lands and fails into an error that names the program code', async () => {
    const connection = fakeConnection({
      err: { InstructionError: [0, { Custom: 6019 }] },
    });
    const failure = await sendInstructions({
      connection,
      wallet: { publicKey: payer, sendTransaction: vi.fn(async () => 'SIG') },
      instructions: [instruction],
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(TransactionFailedError);
    expect(classifyTxError(failure)).toEqual({
      kind: 'program',
      code: 'NothingToClaim',
    });
  });

  it('lets a wallet rejection through untouched so it can be classified', async () => {
    const connection = fakeConnection({ err: null });
    const rejection = Object.assign(new Error('User rejected the request.'), {
      name: 'WalletSignTransactionError',
    });
    const failure = await sendInstructions({
      connection,
      wallet: {
        publicKey: payer,
        sendTransaction: vi.fn(async () => {
          throw rejection;
        }),
      },
      instructions: [instruction],
    }).catch((error: unknown) => error);
    expect(classifyTxError(failure)).toEqual({ kind: 'wallet-rejected' });
    expect(connection.confirmTransaction).not.toHaveBeenCalled();
  });
});
