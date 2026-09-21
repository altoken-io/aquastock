// Turns a confirmed transaction into activity rows by re-reading it from the chain. A
// client only says "look at this signature"; what it records is what the program logged.
import { EventParser } from '@anchor-lang/core';
import { PublicKey } from '@solana/web3.js';

import { ApiError } from '../api/errors';
import type { ChainClient } from './chain';
import type { ActivityInput } from './store';

/** A single transaction cannot legitimately emit more than a handful of events. */
const MAX_EVENTS_PER_TRANSACTION = 25;

export interface PoolEvents {
  pool: PublicKey;
  rows: ActivityInput[];
}

function pubkey(value: unknown, field: string): PublicKey {
  if (value instanceof PublicKey) return value;
  throw new Error(`event field ${field} is not a public key`);
}

function amount(value: unknown, field: string): bigint {
  // Anchor decodes u64 as BN; accept anything whose decimal form is a plain integer.
  if (typeof value === 'object' && value !== null) {
    const text = value.toString();
    if (/^\d+$/.test(text)) return BigInt(text);
  }
  throw new Error(`event field ${field} is not an integer`);
}

function field(data: unknown, name: string): unknown {
  if (typeof data === 'object' && data !== null && name in data) {
    return Reflect.get(data, name);
  }
  throw new Error(`event is missing field ${name}`);
}

/** Maps one decoded program event to an activity row, or null for events we do not show. */
export function eventToActivity(
  name: string,
  data: unknown,
  meta: { txSignature: string; eventIndex: number; occurredAt: Date },
): { pool: PublicKey; row: ActivityInput } | null {
  const pool = (): PublicKey => pubkey(field(data, 'pool'), 'pool');
  const base = { ...meta, amount: null, matchAmount: null };

  switch (name.toLowerCase()) {
    case 'poolcreated':
      return {
        pool: pool(),
        row: {
          ...base,
          kind: 'POOL_CREATED',
          wallet: pubkey(field(data, 'sponsor'), 'sponsor').toBase58(),
        },
      };
    case 'matchfunded':
      return {
        pool: pool(),
        row: {
          ...base,
          kind: 'MATCH_FUNDED',
          wallet: pubkey(field(data, 'sponsor'), 'sponsor').toBase58(),
          amount: amount(field(data, 'amount'), 'amount'),
        },
      };
    case 'deposited':
      return {
        pool: pool(),
        row: {
          ...base,
          kind: 'DEPOSITED',
          wallet: pubkey(field(data, 'saver'), 'saver').toBase58(),
          amount: amount(field(data, 'amount'), 'amount'),
          matchAmount: amount(field(data, 'matchReserved'), 'matchReserved'),
        },
      };
    case 'claimed':
      return {
        pool: pool(),
        row: {
          ...base,
          kind: 'CLAIMED',
          wallet: pubkey(field(data, 'saver'), 'saver').toBase58(),
          amount: amount(field(data, 'amount'), 'amount'),
        },
      };
    case 'withdrawn':
      return {
        pool: pool(),
        row: {
          ...base,
          kind: 'WITHDRAWN',
          wallet: pubkey(field(data, 'saver'), 'saver').toBase58(),
          amount: amount(field(data, 'principal'), 'principal'),
          matchAmount: amount(field(data, 'forfeited'), 'forfeited'),
        },
      };
    case 'unmatchedreclaimed':
      return {
        pool: pool(),
        row: {
          ...base,
          kind: 'UNMATCHED_RECLAIMED',
          wallet: pubkey(field(data, 'sponsor'), 'sponsor').toBase58(),
          amount: amount(field(data, 'amount'), 'amount'),
        },
      };
    case 'positionclosed':
      return {
        pool: pool(),
        row: {
          ...base,
          kind: 'POSITION_CLOSED',
          wallet: pubkey(field(data, 'saver'), 'saver').toBase58(),
        },
      };
    default:
      return null;
  }
}

/**
 * Anchor throws a plain Error when the log stream does not start with a program invoke line
 * (for example when the logs were truncated). Surface that as a clean, explicit failure
 * rather than silently recording nothing.
 */
function* decodeEvents(parser: EventParser, logs: string[]) {
  try {
    yield* parser.parseLogs(logs);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      422,
      'unreadable_logs',
      'the transaction logs could not be read',
    );
  }
}

/** Decodes the program's events from log lines. Logs of other programs are ignored. */
export function parseProgramEvents(
  client: ChainClient,
  logs: string[],
  meta: { txSignature: string; occurredAt: Date },
): PoolEvents[] {
  // Solana truncates very long logs, and Anchor's scanner treats the marker as the end of
  // the stream, which would silently yield no events. Refuse instead of misreporting.
  if (logs.includes('Log truncated')) {
    throw new ApiError(
      422,
      'logs_truncated',
      'the transaction logs were truncated, so its events cannot be verified',
    );
  }
  const parser = new EventParser(client.programId, client.program.coder);
  const byPool = new Map<string, PoolEvents>();
  let index = 0;
  for (const event of decodeEvents(parser, logs)) {
    const mapped = eventToActivity(event.name, event.data, {
      ...meta,
      eventIndex: index,
    });
    index += 1;
    if (index > MAX_EVENTS_PER_TRANSACTION) {
      throw new ApiError(
        422,
        'too_many_events',
        'transaction has too many events',
      );
    }
    if (!mapped) continue;
    const key = mapped.pool.toBase58();
    const entry = byPool.get(key) ?? { pool: mapped.pool, rows: [] };
    entry.rows.push(mapped.row);
    byPool.set(key, entry);
  }
  return [...byPool.values()];
}

/** Fetches a transaction and returns its program events, refusing anything unconfirmed or failed. */
export async function fetchTransactionEvents(
  client: ChainClient,
  signature: string,
): Promise<PoolEvents[]> {
  const transaction = await client.connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  if (!transaction) {
    throw new ApiError(
      404,
      'transaction_not_found',
      'transaction not found or not confirmed yet',
    );
  }
  if (transaction.meta?.err) {
    throw new ApiError(
      422,
      'transaction_failed',
      'transaction failed on-chain',
    );
  }
  if (transaction.blockTime === null || transaction.blockTime === undefined) {
    throw new ApiError(
      422,
      'transaction_unconfirmed',
      'transaction has no block time yet',
    );
  }
  return parseProgramEvents(client, transaction.meta?.logMessages ?? [], {
    txSignature: signature,
    occurredAt: new Date(transaction.blockTime * 1000),
  });
}
