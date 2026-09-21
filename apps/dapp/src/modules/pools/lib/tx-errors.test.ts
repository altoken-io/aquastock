import { AnchorError, ProgramError } from '@anchor-lang/core';
import { matchPoolsIdl } from '@aquastock/types/program';
import { describe, expect, it } from 'vitest';

import {
  PROGRAM_ERROR_CODES,
  TransactionFailedError,
  classifyTxError,
} from './tx-errors';

function anchorError(code: string, number: number): AnchorError {
  const parsed = AnchorError.parse([
    'Program 92EVZikCaJ1SXTJAq7e8NzzZg5zLKjK2LyX14SQeQRfE invoke [1]',
    `Program log: AnchorError thrown in programs/match_pools/src/instructions/deposit.rs:58. Error Code: ${code}. Error Number: ${number}. Error Message: A message.`,
  ]);
  if (!parsed) throw new Error('fixture did not parse');
  return parsed;
}

describe('classifyTxError', () => {
  it('names the program error from a real AnchorError', () => {
    expect(classifyTxError(anchorError('DepositExceedsCap', 6015))).toEqual({
      kind: 'program',
      code: 'DepositExceedsCap',
    });
    expect(classifyTxError(anchorError('MintPaused', 6012))).toEqual({
      kind: 'program',
      code: 'MintPaused',
    });
  });

  it('recovers the name from the number when only a ProgramError is thrown', () => {
    expect(classifyTxError(new ProgramError(6018, 'x'))).toEqual({
      kind: 'program',
      code: 'MatchBelowMinimum',
    });
  });

  it('names the program error of a transaction that landed and failed', () => {
    const failed = new TransactionFailedError(
      { InstructionError: [1, { Custom: 6016 }] },
      'sig',
    );
    expect(failed.customCode).toBe(6016);
    expect(classifyTxError(failed)).toEqual({
      kind: 'program',
      code: 'DepositExceedsCap',
    });
    // Anything that is not one of our codes is honest about being unknown.
    expect(
      classifyTxError(
        new TransactionFailedError(
          { InstructionError: [0, 'InvalidArgument'] },
          's',
        ),
      ),
    ).toEqual({ kind: 'unknown' });
    expect(
      classifyTxError(new TransactionFailedError('BlockhashNotFound', 's')),
    ).toEqual({
      kind: 'unknown',
    });
  });

  it('understands a wallet that only reports the hex custom error code', () => {
    expect(
      classifyTxError(
        new Error(
          'Transaction simulation failed: custom program error: 0x1780',
        ),
      ),
    ).toEqual({ kind: 'program', code: 'DepositExceedsCap' });
    // 0x1 is the system program's "insufficient lamports", not one of ours.
    expect(
      classifyTxError(new Error('failed: custom program error: 0x1')),
    ).toEqual({ kind: 'insufficient-sol' });
  });

  it('reads the error name out of simulation logs', () => {
    const error = Object.assign(new Error('Simulation failed'), {
      logs: [
        'Program log: AnchorError thrown in x.rs:1. Error Code: BudgetExhausted. Error Number: 6017. Error Message: m.',
      ],
    });
    expect(classifyTxError(error)).toEqual({
      kind: 'program',
      code: 'BudgetExhausted',
    });
  });

  it("ignores an error code that is not this program's", () => {
    expect(classifyTxError(new Error('Error Code: SomethingElse'))).toEqual({
      kind: 'unknown',
    });
  });

  it('recognises a wallet that declined', () => {
    for (const message of [
      'User rejected the request.',
      'Transaction cancelled',
      'The user denied the request',
      'User closed the window',
    ]) {
      expect(classifyTxError(new Error(message)), message).toEqual({
        kind: 'wallet-rejected',
      });
    }
    const named = Object.assign(new Error('Wallet not connected'), {
      name: 'WalletNotConnectedError',
    });
    expect(classifyTxError(named)).toEqual({ kind: 'wallet-not-connected' });
  });

  it('recognises an account with no SOL', () => {
    expect(
      classifyTxError(
        new Error(
          'Attempt to debit an account but found no record of a prior credit.',
        ),
      ),
    ).toEqual({ kind: 'insufficient-sol' });
    expect(
      classifyTxError(new Error('insufficient lamports 1, need 5000')),
    ).toEqual({ kind: 'insufficient-sol' });
  });

  it('recognises an expired transaction and a network failure', () => {
    expect(classifyTxError(new Error('Blockhash not found'))).toEqual({
      kind: 'expired',
    });
    expect(classifyTxError(new Error('block height exceeded'))).toEqual({
      kind: 'expired',
    });
    expect(classifyTxError(new TypeError('Failed to fetch'))).toEqual({
      kind: 'network',
    });
    expect(classifyTxError(new Error('429 Too Many Requests'))).toEqual({
      kind: 'network',
    });
  });

  it('falls back to unknown for anything else, including non-errors', () => {
    for (const value of [
      new Error('something odd'),
      'oops',
      null,
      undefined,
      42,
      {},
    ]) {
      expect(classifyTxError(value)).toEqual({ kind: 'unknown' });
    }
  });

  it('never leaks a message that is not a recognised category', () => {
    const result = classifyTxError(
      new Error('secret rpc https://x.example/?key=SECRET'),
    );
    expect(JSON.stringify(result)).not.toContain('SECRET');
  });
});

describe('PROGRAM_ERROR_CODES', () => {
  it('lists every error in the IDL, PascalCase, in code order', () => {
    expect(PROGRAM_ERROR_CODES).toHaveLength(matchPoolsIdl.errors.length);
    expect(PROGRAM_ERROR_CODES[0]).toBe('MathOverflow');
    expect(PROGRAM_ERROR_CODES).toContain('DepositExceedsCap');
    expect(
      PROGRAM_ERROR_CODES.every((code) => /^[A-Z][A-Za-z]+$/.test(code)),
    ).toBe(true);
  });
});
