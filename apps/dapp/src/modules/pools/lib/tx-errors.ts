// Turns whatever a wallet or RPC throws into a small set of things a person can act on. The
// program's own errors keep their exact name, so each has its own message.
import { AnchorError, ProgramError } from '@anchor-lang/core';
import { matchPoolsIdl } from '@aquastock/types/program';

/** The program's error names, PascalCase, derived from the IDL so a new error is a type error here. */
export type ProgramErrorCode = Capitalize<
  (typeof matchPoolsIdl.errors)[number]['name']
>;

export type TxErrorInfo =
  | { kind: 'program'; code: ProgramErrorCode }
  | { kind: 'wallet-rejected' }
  | { kind: 'wallet-not-connected' }
  | { kind: 'insufficient-sol' }
  | { kind: 'expired' }
  | { kind: 'network' }
  | { kind: 'unknown' };

const pascal = (name: string): string =>
  name.charAt(0).toUpperCase() + name.slice(1);

/** Every error the program can return, PascalCase as it appears in Rust and in Anchor logs. */
export const PROGRAM_ERROR_CODES: readonly string[] = matchPoolsIdl.errors.map(
  (error) => pascal(error.name),
);

const PROGRAM_ERROR_NAMES: ReadonlySet<string> = new Set(PROGRAM_ERROR_CODES);

export function isProgramErrorCode(name: string): name is ProgramErrorCode {
  return PROGRAM_ERROR_NAMES.has(name);
}

const NAME_BY_NUMBER = new Map<number, ProgramErrorCode>();
for (const error of matchPoolsIdl.errors) {
  const name = pascal(error.name);
  if (isProgramErrorCode(name)) NAME_BY_NUMBER.set(error.code, name);
}

/** Returns the program's error name for a code from a log or an Anchor error, if it is one. */
const canonical = (name: string): ProgramErrorCode | undefined => {
  const candidate = pascal(name);
  return isProgramErrorCode(candidate) ? candidate : undefined;
};

function textOf(error: unknown): string {
  if (typeof error === 'string') return error;
  if (typeof error !== 'object' || error === null) return '';
  const parts: string[] = [];
  const message = Reflect.get(error, 'message');
  if (typeof message === 'string') parts.push(message);
  const logs = Reflect.get(error, 'logs');
  if (Array.isArray(logs))
    parts.push(logs.filter((l) => typeof l === 'string').join('\n'));
  const inner = Reflect.get(error, 'error');
  if (inner && inner !== error) parts.push(textOf(inner));
  return parts.join('\n');
}

function nameOf(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const name = Reflect.get(error, 'name');
  return typeof name === 'string' ? name : '';
}

/**
 * A transaction that reached the chain and failed. `err` is the RPC's `TransactionError`, whose
 * program failures look like `{ InstructionError: [index, { Custom: code }] }`.
 */
export class TransactionFailedError extends Error {
  readonly customCode: number | null;
  constructor(
    readonly err: unknown,
    readonly signature: string,
  ) {
    super('Transaction failed on chain');
    this.name = 'TransactionFailedError';
    this.customCode = customCodeOf(err);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function customCodeOf(err: unknown): number | null {
  if (!isRecord(err)) return null;
  const detail = err['InstructionError'];
  if (!Array.isArray(detail) || detail.length < 2) return null;
  const failure: unknown = detail[1];
  if (!isRecord(failure)) return null;
  const code = failure['Custom'];
  return typeof code === 'number' ? code : null;
}

export function classifyTxError(error: unknown): TxErrorInfo {
  if (error instanceof TransactionFailedError) {
    const code =
      error.customCode === null
        ? undefined
        : NAME_BY_NUMBER.get(error.customCode);
    return code ? { kind: 'program', code } : { kind: 'unknown' };
  }
  if (error instanceof AnchorError) {
    const code = canonical(error.error.errorCode.code);
    if (code) return { kind: 'program', code };
  }
  if (error instanceof ProgramError) {
    const code = NAME_BY_NUMBER.get(error.code);
    if (code) return { kind: 'program', code };
  }

  const text = textOf(error);
  const name = nameOf(error);

  // The program's own error name appears in the logs of a failed simulation.
  const logged = /Error Code: (\w+)/.exec(text)?.[1];
  const loggedCode = logged ? canonical(logged) : undefined;
  if (loggedCode) return { kind: 'program', code: loggedCode };

  // Some wallets only pass on the simulation's hex code, never the log lines.
  const hex = /custom program error: 0x([0-9a-f]+)/i.exec(text)?.[1];
  const hexCode = hex
    ? NAME_BY_NUMBER.get(Number.parseInt(hex, 16))
    : undefined;
  if (hexCode) return { kind: 'program', code: hexCode };

  if (name === 'WalletNotConnectedError')
    return { kind: 'wallet-not-connected' };
  if (
    /user rejected|rejected the request|declined|denied|cancell?ed|user closed/i.test(
      text,
    )
  ) {
    return { kind: 'wallet-rejected' };
  }
  if (
    /insufficient (funds|lamports)|no record of a prior credit|custom program error: 0x1\b/i.test(
      text,
    )
  ) {
    return { kind: 'insufficient-sol' };
  }
  if (
    /blockhash not found|block height exceeded|expired|TransactionExpired/i.test(
      text,
    )
  ) {
    return { kind: 'expired' };
  }
  if (
    /failed to fetch|networkerror|network request|timed? ?out|econn|429|too many requests|rate limit|503|502/i.test(
      text,
    )
  ) {
    return { kind: 'network' };
  }
  return { kind: 'unknown' };
}
