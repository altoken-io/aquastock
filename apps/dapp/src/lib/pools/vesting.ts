// A BigInt mirror of the program's vesting and match arithmetic (`vesting.rs`). Used to
// preview what a call will do and to show progress. The chain decides what actually
// happens; `vesting.test.ts` pins this to vectors produced by the Rust functions.

const U64_MAX = (1n << 64n) - 1n;
const BPS_DENOMINATOR = 10_000n;

export interface PositionState {
  deposited: bigint;
  matchReserved: bigint;
  matchClaimed: bigint;
  startedAt: number;
  /** True after `withdraw`: the unvested part is gone and what remains is fully vested. */
  settled: boolean;
}

function assertU64(value: bigint, label: string): void {
  if (value < 0n || value > U64_MAX) {
    throw new RangeError(`${label} must fit in a u64`);
  }
}

function assertTime(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be an integer number of seconds`);
  }
}

/** Linear vesting, rounded down; nothing at `startedAt`, everything after `duration`. */
export function vestedAmount(
  reserved: bigint,
  startedAt: number,
  durationSeconds: number,
  now: number,
): bigint {
  assertU64(reserved, 'reserved');
  assertTime(startedAt, 'startedAt');
  assertTime(durationSeconds, 'durationSeconds');
  assertTime(now, 'now');
  if (durationSeconds <= 0) {
    throw new RangeError('durationSeconds must be greater than zero');
  }
  if (now <= startedAt) return 0n;
  const elapsed = BigInt(now) - BigInt(startedAt);
  const duration = BigInt(durationSeconds);
  if (elapsed >= duration) return reserved;
  return (reserved * elapsed) / duration;
}

/** Match a deposit earns before the budget limit applies. */
export function matchForDeposit(amount: bigint, matchBps: number): bigint {
  assertU64(amount, 'amount');
  if (!Number.isInteger(matchBps) || matchBps < 0 || matchBps > 65_535) {
    throw new RangeError('matchBps must be a u16');
  }
  return (amount * BigInt(matchBps)) / BPS_DENOMINATOR;
}

export interface DepositPreview {
  /** Match this deposit would reserve. */
  matched: bigint;
  /** True when the pool has no unreserved budget: the program refuses the deposit. */
  budgetExhausted: boolean;
  /** True when the budget is smaller than the full match, so the saver gets less. */
  partial: boolean;
}

export function previewDeposit(
  amount: bigint,
  matchBps: number,
  unreserved: bigint,
): DepositPreview {
  const wanted = matchForDeposit(amount, matchBps);
  const matched = wanted < unreserved ? wanted : unreserved;
  return {
    matched,
    budgetExhausted: unreserved === 0n,
    partial: unreserved > 0n && matched < wanted,
  };
}

/** Vested match for a position at `now`. */
export function vestedForPosition(
  position: PositionState,
  durationSeconds: number,
  now: number,
): bigint {
  if (position.settled) return position.matchReserved;
  return vestedAmount(
    position.matchReserved,
    position.startedAt,
    durationSeconds,
    now,
  );
}

/** What `claim_vested` would pay at `now`; zero when nothing new has vested. */
export function claimableForPosition(
  position: PositionState,
  durationSeconds: number,
  now: number,
): bigint {
  const vested = vestedForPosition(position, durationSeconds, now);
  return vested > position.matchClaimed ? vested - position.matchClaimed : 0n;
}

export interface WithdrawPreview {
  /** The whole principal comes back. */
  principal: bigint;
  /** Unvested match returned to the sponsor's unreserved budget. */
  forfeited: bigint;
  /** Vested match the saver keeps, claimed or not. */
  keptVested: bigint;
}

/** What `withdraw` would do at `now`. Only meaningful before the position is settled. */
export function previewWithdraw(
  position: PositionState,
  durationSeconds: number,
  now: number,
): WithdrawPreview {
  const vested = vestedForPosition(position, durationSeconds, now);
  return {
    principal: position.deposited,
    forfeited: position.matchReserved - vested,
    keptVested: vested,
  };
}
