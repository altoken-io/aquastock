import type { PositionDto } from '@aquastock/types';
import { describe, expect, it } from 'vitest';

import { totalPositions, viewPosition } from './position-view';

const ONE = 100_000_000n;
const START = 1_800_000_000;
const pool = { vestingSeconds: 1_000 };

function position(over: Partial<PositionDto> = {}): PositionDto {
  return {
    address: 'pos',
    pool: 'pool',
    saver: 'saver',
    deposited: (100n * ONE).toString(),
    matchReserved: (100n * ONE).toString(),
    matchClaimed: '0',
    startedAt: START,
    settled: false,
    vested: '0',
    claimable: '0',
    asOf: START,
    ...over,
  };
}

describe('viewPosition', () => {
  it('is vesting linearly, and claimable is what has vested minus what was paid', () => {
    const view = viewPosition(
      position({ matchClaimed: (10n * ONE).toString() }),
      pool,
      START + 250,
    );
    expect(view.status).toBe('vesting');
    expect(view.vested).toBe(25n * ONE);
    expect(view.claimable).toBe(15n * ONE);
    expect(view.fraction).toBe(0.25);
    expect(view.canClose).toBe(false);
  });

  it('is fully vested once the schedule ends, even if nothing was claimed', () => {
    const view = viewPosition(position(), pool, START + 5_000);
    expect(view.status).toBe('vested');
    expect(view.claimable).toBe(100n * ONE);
    expect(view.fraction).toBe(1);
  });

  it('after a withdrawal the remainder counts as vested and is still claimable', () => {
    const view = viewPosition(
      position({
        settled: true,
        deposited: '0',
        matchReserved: (30n * ONE).toString(),
        matchClaimed: (10n * ONE).toString(),
      }),
      pool,
      START + 1,
    );
    expect(view.status).toBe('withdrawn');
    expect(view.vested).toBe(30n * ONE);
    expect(view.claimable).toBe(20n * ONE);
    expect(view.canClose).toBe(false);
  });

  it('is done and closable only when withdrawn and fully claimed', () => {
    const view = viewPosition(
      position({
        settled: true,
        deposited: '0',
        matchReserved: (30n * ONE).toString(),
        matchClaimed: (30n * ONE).toString(),
      }),
      pool,
      START + 1,
    );
    expect(view.status).toBe('done');
    expect(view.canClose).toBe(true);
    expect(view.claimable).toBe(0n);
  });

  it('a position with no match reserved reads as fully vested, not as a division by zero', () => {
    const view = viewPosition(
      position({ matchReserved: '0' }),
      pool,
      START + 1,
    );
    expect(view.fraction).toBe(1);
    expect(view.status).toBe('vested');
    expect(view.claimable).toBe(0n);
  });

  it('never shows anything vested before the deposit', () => {
    const view = viewPosition(position(), pool, START - 500);
    expect(view.vested).toBe(0n);
    expect(view.fraction).toBe(0);
  });
});

describe('totalPositions', () => {
  it('sums deposits, reserved match, claimed and claimable across pools', () => {
    const a = viewPosition(position(), pool, START + 500);
    const b = viewPosition(
      position({
        deposited: (20n * ONE).toString(),
        matchReserved: (20n * ONE).toString(),
        matchClaimed: (5n * ONE).toString(),
      }),
      pool,
      START + 500,
    );
    expect(totalPositions([a, b])).toEqual({
      deposited: 120n * ONE,
      matchReserved: 120n * ONE,
      claimed: 5n * ONE,
      claimable: 50n * ONE + 5n * ONE,
    });
    expect(totalPositions([])).toEqual({
      deposited: 0n,
      matchReserved: 0n,
      claimed: 0n,
      claimable: 0n,
    });
  });
});
