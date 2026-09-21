// @vitest-environment node
import { BN } from '@anchor-lang/core';
import { matchPoolsIdl } from '@aquastock/types/program';
import { describe, expect, it } from 'vitest';

import { ApiError } from '../api/errors';
import { eventToActivity, parseProgramEvents } from './activity';
import { createChainClient } from './chain';
import { PROGRAM_ID, newKey } from './test-fakes';

// No request is ever made: the connection is only used to build the program's coder.
const client = createChainClient('http://127.0.0.1:9', PROGRAM_ID);
const META = {
  txSignature: '5'.repeat(88),
  occurredAt: new Date(1_800_000_000_000),
};
const PROGRAM = PROGRAM_ID.toBase58();

/** A `Program data:` log line exactly as `emit!` writes it. */
function eventLog(name: string, data: Record<string, unknown>): string {
  const event = matchPoolsIdl.events.find(
    (candidate) => candidate.name === name,
  );
  if (!event) throw new Error(`no event ${name} in the IDL`);
  const body = client.program.coder.types.encode(name, data);
  return `Program data: ${Buffer.concat([Buffer.from(event.discriminator), body]).toString('base64')}`;
}

const wrap = (...lines: string[]): string[] => [
  `Program ${PROGRAM} invoke [1]`,
  'Program log: Instruction: Deposit',
  ...lines,
  `Program ${PROGRAM} success`,
];

const pool = newKey();
const saver = newKey();
const sponsor = newKey();

describe('parseProgramEvents on real Anchor log lines', () => {
  it('decodes a deposit into an activity row', () => {
    const logs = wrap(
      eventLog('deposited', {
        pool,
        saver,
        amount: new BN(40_000_000),
        matchReserved: new BN(30_000_000),
        startedAt: new BN(1_800_000_000),
      }),
    );
    const [group] = parseProgramEvents(client, logs, META);
    expect(group?.pool.equals(pool)).toBe(true);
    expect(group?.rows).toEqual([
      {
        ...META,
        kind: 'DEPOSITED',
        wallet: saver.toBase58(),
        amount: 40_000_000n,
        matchAmount: 30_000_000n,
        eventIndex: 0,
      },
    ]);
  });

  it('decodes every event kind the feed shows', () => {
    const cases: [
      string,
      Record<string, unknown>,
      string,
      bigint | null,
      bigint | null,
    ][] = [
      [
        'poolCreated',
        {
          pool,
          sponsor,
          mint: newKey(),
          poolId: new BN(1),
          matchBps: 10_000,
          perSaverCap: new BN(1),
          vestingSeconds: new BN(30),
          endsAt: new BN(1),
        },
        'POOL_CREATED',
        null,
        null,
      ],
      [
        'matchFunded',
        { pool, sponsor, amount: new BN(500), budgetTotal: new BN(500) },
        'MATCH_FUNDED',
        500n,
        null,
      ],
      [
        'claimed',
        { pool, saver, amount: new BN(7), totalClaimed: new BN(7) },
        'CLAIMED',
        7n,
        null,
      ],
      [
        'withdrawn',
        { pool, saver, principal: new BN(100), forfeited: new BN(60) },
        'WITHDRAWN',
        100n,
        60n,
      ],
      [
        'unmatchedReclaimed',
        { pool, sponsor, amount: new BN(9), budgetTotal: new BN(1) },
        'UNMATCHED_RECLAIMED',
        9n,
        null,
      ],
      ['positionClosed', { pool, saver }, 'POSITION_CLOSED', null, null],
    ];
    for (const [name, data, kind, amount, matchAmount] of cases) {
      const [group] = parseProgramEvents(
        client,
        wrap(eventLog(name, data)),
        META,
      );
      expect(group?.rows[0], name).toMatchObject({ kind, amount, matchAmount });
    }
  });

  it('numbers events across the transaction and groups them by pool', () => {
    const other = newKey();
    const logs = wrap(
      eventLog('matchFunded', {
        pool,
        sponsor,
        amount: new BN(1),
        budgetTotal: new BN(1),
      }),
      eventLog('claimed', {
        pool: other,
        saver,
        amount: new BN(2),
        totalClaimed: new BN(2),
      }),
      eventLog('claimed', {
        pool,
        saver,
        amount: new BN(3),
        totalClaimed: new BN(3),
      }),
    );
    const groups = parseProgramEvents(client, logs, META);
    expect(groups).toHaveLength(2);
    const mine = groups.find((g) => g.pool.equals(pool));
    expect(mine?.rows.map((r) => r.eventIndex)).toEqual([0, 2]);
  });

  it("ignores another program's logs, garbage lines, and events with no feed entry", () => {
    const foreign = [
      'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [1]',
      eventLog('claimed', {
        pool,
        saver,
        amount: new BN(1),
        totalClaimed: new BN(1),
      }),
      'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success',
    ];
    const noise = wrap(
      'Program data: !!!not base64!!!',
      'Program data: AAAA',
      'Program log: hello',
    );
    const config = wrap(
      eventLog('configInitialized', { admin: sponsor, allowedMint: newKey() }),
    );
    expect(
      parseProgramEvents(client, [...foreign, ...noise, ...config], META),
    ).toEqual([]);
  });

  it('reports unreadable logs as a clean error instead of recording nothing', () => {
    for (const logs of [
      ['Program log: no invoke line first'],
      [`Program ${PROGRAM} invoke [2]`],
      ['Log truncated'],
    ]) {
      expect(() => parseProgramEvents(client, logs, META)).toThrow(ApiError);
    }
    expect(parseProgramEvents(client, [], META)).toEqual([]);
    // A valid invoke with nothing emitted is fine: zero events, not an error.
    expect(
      parseProgramEvents(
        client,
        [`Program ${PROGRAM} invoke [1]`, `Program ${PROGRAM} success`],
        META,
      ),
    ).toEqual([]);
    // Truncation must never look like "no events".
    const truncated = wrap(
      eventLog('claimed', {
        pool,
        saver,
        amount: new BN(1),
        totalClaimed: new BN(1),
      }),
      'Log truncated',
    );
    expect(() => parseProgramEvents(client, truncated, META)).toThrow(
      'truncated',
    );
  });

  it('refuses a transaction claiming an implausible number of events', () => {
    const many = wrap(
      ...Array.from({ length: 26 }, () =>
        eventLog('claimed', {
          pool,
          saver,
          amount: new BN(1),
          totalClaimed: new BN(1),
        }),
      ),
    );
    expect(() => parseProgramEvents(client, many, META)).toThrow(ApiError);
  });
});

describe('eventToActivity', () => {
  it('returns null for an event it does not show, and throws on a malformed one', () => {
    expect(
      eventToActivity('somethingNew', {}, { ...META, eventIndex: 0 }),
    ).toBeNull();
    expect(() =>
      eventToActivity('deposited', { pool }, { ...META, eventIndex: 0 }),
    ).toThrow();
    expect(() =>
      eventToActivity(
        'claimed',
        { pool, saver, amount: 'nope' },
        { ...META, eventIndex: 0 },
      ),
    ).toThrow();
  });
});
