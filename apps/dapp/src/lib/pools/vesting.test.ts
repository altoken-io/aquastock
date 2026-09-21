import { describe, expect, it } from 'vitest';

import {
  claimableForPosition,
  matchForDeposit,
  previewDeposit,
  previewWithdraw,
  vestedAmount,
  type PositionState,
} from './vesting';

// Produced by running the program's own `vested_amount` and `match_for_deposit` in Rust
// (programs/programs/match_pools/src/vesting.rs), including u64 and five-year extremes.
// [reserved, startedAt, duration, now, expectedVested]
const VESTED_VECTORS: [string, number, number, number, string][] = [
  ['1000', 100, 60, 100, '0'],
  ['1000', 100, 60, 99, '0'],
  ['1000', 100, 60, 160, '1000'],
  ['1000', 100, 60, 10000, '1000'],
  ['10', 0, 3, 1, '3'],
  ['10', 0, 3, 2, '6'],
  ['0', 0, 10, 5, '0'],
  ['18446744073709551615', 0, 1, 1, '18446744073709551615'],
  ['18446744073709551615', 0, 157680000, 157679999, '18446743956721068143'],
  ['18446744073709551615', 0, 157680000, 78840000, '9223372036854775807'],
  ['1', 0, 1000, 999, '0'],
  ['4000000000', 1800000000, 1000, 1800000250, '1000000000'],
  ['51073509710661699', 1069677145, 100487196, 1137789878, '34618901400086908'],
  ['495785306392163', 626156172, 61185318, 784901286, '495785306392163'],
  ['1576349141', 2113559211, 2636862, 2288535254, '1576349141'],
  ['396231517', 3962051180, 141081475, 4063536009, '285023159'],
  [
    '517533186074651526',
    3795856162,
    149421188,
    3875004398,
    '274136749262550586',
  ],
  ['98817759826175', 1626742908, 97222135, 1816694220, '98817759826175'],
  [
    '497923019987824503',
    1828736551,
    13036055,
    2015730010,
    '497923019987824503',
  ],
  ['91906266927864987', 495705971, 46304432, 576477454, '91906266927864987'],
  ['1575683587391', 2008624510, 30560413, 2013489344, '250829041125'],
  [
    '121485091836418159',
    3078395320,
    144541247,
    3155869892,
    '65116398880986483',
  ],
  ['902773494', 1085832280, 39249861, 1096387613, '242779836'],
  ['7882638654012', 3385600400, 39656803, 3564086633, '7882638654012'],
  ['28473292', 3649365375, 142759757, 3759276568, '21921678'],
  ['2899439982', 2396596341, 105486894, 2492286871, '2630174593'],
  [
    '273517509265895331',
    2004962038,
    23246132,
    2162990853,
    '273517509265895331',
  ],
  ['30951231159152', 2206793514, 38370231, 2388733979, '30951231159152'],
  ['17881758', 3596747292, 76334420, 3686109924, '17881758'],
  ['21430050477797055', 1613497092, 150719841, 1705024529, '13013798196704505'],
  ['3030888136872881', 395489639, 87202036, 403178063, '267227167641461'],
  ['1117346', 3340785725, 123375179, 3376826788, '326405'],
  [
    '142630600407562605',
    1546548118,
    81032273,
    1647171625,
    '142630600407562605',
  ],
  ['3007063716745946', 3406568357, 35793962, 3576324365, '3007063716745946'],
  ['90845301552334', 1126916536, 155365263, 1131036406, '2408973700294'],
  ['46745765013846', 3176423062, 136748020, 3318890479, '46745765013846'],
  ['4232986', 2658943515, 125422728, 2827664951, '4232986'],
  ['21717355', 46800494, 157460102, 141989453, '13128737'],
  ['5235710759512716', 2203657601, 69620794, 2244069764, '3039126451707541'],
  ['64684157870730299', 2589837034, 64917696, 2721600596, '64684157870730299'],
];

// [amount, matchBps, expectedMatch]
const MATCH_VECTORS: [string, number, string][] = [
  ['1000', 10000, '1000'],
  ['1000', 5000, '500'],
  ['3', 3333, '0'],
  ['10', 3333, '3'],
  ['18446744073709551615', 10000, '18446744073709551615'],
  ['0', 1, '0'],
  ['9999', 1, '0'],
  ['100000000', 2500, '25000000'],
  ['123456789', 7777, '96012344'],
];

describe('vestedAmount matches the Rust program', () => {
  it.each(VESTED_VECTORS)(
    'reserved %s start %i duration %i now %i',
    (reserved, start, duration, now, expected) => {
      expect(vestedAmount(BigInt(reserved), start, duration, now)).toBe(
        BigInt(expected),
      );
    },
  );
});

describe('matchForDeposit matches the Rust program', () => {
  it.each(MATCH_VECTORS)('amount %s at %i bps', (amount, bps, expected) => {
    expect(matchForDeposit(BigInt(amount), bps)).toBe(BigInt(expected));
  });
});

describe('input validation', () => {
  it('rejects a non-positive duration and non-u64 or non-integer inputs', () => {
    expect(() => vestedAmount(1n, 0, 0, 5)).toThrow(RangeError);
    expect(() => vestedAmount(1n, 0, -5, 5)).toThrow(RangeError);
    expect(() => vestedAmount(-1n, 0, 10, 5)).toThrow(RangeError);
    expect(() => vestedAmount(1n << 64n, 0, 10, 5)).toThrow(RangeError);
    expect(() => vestedAmount(1n, 0.5, 10, 5)).toThrow(RangeError);
    expect(() => vestedAmount(1n, 0, 10, Number.NaN)).toThrow(RangeError);
    expect(() => matchForDeposit(1n, 65_536)).toThrow(RangeError);
    expect(() => matchForDeposit(1n, -1)).toThrow(RangeError);
  });
});

describe('vesting properties', () => {
  // splitmix64 over BigInt, so the property test is deterministic.
  let state = 0x1234_5678n;
  const next = (): bigint => {
    state = (state + 0x9e37_79b9_7f4a_7c15n) & 0xffff_ffff_ffff_ffffn;
    let z = state;
    z = ((z ^ (z >> 30n)) * 0xbf58_476d_1ce4_e5b9n) & 0xffff_ffff_ffff_ffffn;
    z = ((z ^ (z >> 27n)) * 0x94d0_49bb_1331_11ebn) & 0xffff_ffff_ffff_ffffn;
    return z ^ (z >> 31n);
  };

  it('never exceeds the reservation, never goes backwards, and completes at the end', () => {
    for (let i = 0; i < 3_000; i += 1) {
      const reserved = next();
      const start = Number(next() % 4_000_000_000n);
      const duration = Number(next() % 157_680_000n) + 1;
      const t1 = start + Number(next() % 200_000_000n);
      const t2 = t1 + Number(next() % 200_000_000n);
      const v1 = vestedAmount(reserved, start, duration, t1);
      const v2 = vestedAmount(reserved, start, duration, t2);
      expect(v1 <= reserved && v2 <= reserved).toBe(true);
      expect(v1 <= v2).toBe(true);
      if (t2 - start >= duration) expect(v2).toBe(reserved);
    }
  });
});

const position = (over: Partial<PositionState> = {}): PositionState => ({
  deposited: 100n,
  matchReserved: 100n,
  matchClaimed: 0n,
  startedAt: 1_000,
  settled: false,
  ...over,
});

describe('claimableForPosition', () => {
  it('is the vested part minus what was already claimed, never negative', () => {
    expect(claimableForPosition(position(), 1_000, 1_250)).toBe(25n);
    expect(
      claimableForPosition(position({ matchClaimed: 25n }), 1_000, 1_250),
    ).toBe(0n);
    expect(
      claimableForPosition(position({ matchClaimed: 40n }), 1_000, 1_250),
    ).toBe(0n);
    expect(claimableForPosition(position(), 1_000, 5_000)).toBe(100n);
    expect(claimableForPosition(position(), 1_000, 900)).toBe(0n);
  });

  it('treats a settled position as fully vested', () => {
    const settled = position({
      settled: true,
      deposited: 0n,
      matchReserved: 25n,
      matchClaimed: 10n,
    });
    expect(claimableForPosition(settled, 1_000, 1_000)).toBe(15n);
    expect(claimableForPosition(settled, 1_000, 99_999)).toBe(15n);
  });
});

describe('previewWithdraw', () => {
  it('returns the principal and forfeits only the unvested match', () => {
    expect(previewWithdraw(position(), 1_000, 1_250)).toEqual({
      principal: 100n,
      forfeited: 75n,
      keptVested: 25n,
    });
    expect(previewWithdraw(position(), 1_000, 1_000)).toEqual({
      principal: 100n,
      forfeited: 100n,
      keptVested: 0n,
    });
    expect(previewWithdraw(position(), 1_000, 9_999)).toEqual({
      principal: 100n,
      forfeited: 0n,
      keptVested: 100n,
    });
  });
});

describe('previewDeposit', () => {
  it('reserves the full match when the budget covers it', () => {
    expect(previewDeposit(100n, 10_000, 500n)).toEqual({
      matched: 100n,
      budgetExhausted: false,
      partial: false,
    });
  });

  it('is partial when the budget is short and exhausted when it is empty', () => {
    expect(previewDeposit(100n, 10_000, 30n)).toEqual({
      matched: 30n,
      budgetExhausted: false,
      partial: true,
    });
    expect(previewDeposit(100n, 10_000, 0n)).toEqual({
      matched: 0n,
      budgetExhausted: true,
      partial: false,
    });
  });
});
