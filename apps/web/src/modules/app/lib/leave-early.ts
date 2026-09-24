/**
 * What leaving a pool early means, in the program's own arithmetic: the deposit always comes
 * back whole, the match vests in a straight line (rounded down, so the saver is never shown
 * more than the program would pay), and whatever has not vested returns to the sponsor.
 *
 * Kept free of imports so it runs under plain `node --test`.
 */
export type LeaveEarlyInput = {
  deposit: number;
  match: number;
  /** Length of the vesting period, in whole months. */
  months: number;
  /** The month the saver leaves at; clamped to 0..months. */
  leaveAt: number;
};

export type LeaveEarlyResult = {
  /** Months actually counted after clamping. */
  month: number;
  /** 0..1: how much of the vesting period has passed. */
  progress: number;
  /** Returned to the saver: always the whole deposit. */
  depositBack: number;
  /** Vested match the saver keeps. */
  matchKept: number;
  /** Unvested match that returns to the sponsor. */
  matchReturned: number;
};

const wholeNonNegative = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export function leaveEarly(input: LeaveEarlyInput): LeaveEarlyResult {
  const deposit = wholeNonNegative(input.deposit);
  const match = wholeNonNegative(input.match);
  const months = wholeNonNegative(input.months);
  const month = Math.min(wholeNonNegative(input.leaveAt), months);

  // A zero-length vesting period vests everything at once.
  const progress = months === 0 ? 1 : month / months;
  const matchKept = months === 0 ? match : Math.floor((match * month) / months);

  return {
    month,
    progress,
    depositBack: deposit,
    matchKept,
    matchReturned: match - matchKept,
  };
}

export type LeaveEarlyShares = {
  /** Each part as a fraction of everything in play (deposit + match), 0..1, summing to 1. */
  deposit: number;
  kept: number;
  returned: number;
};

/**
 * The three parts of a leave-early result as fractions of the whole position, for drawing them
 * as one bar. An empty position (nothing deposited, nothing matched) is all zeros.
 */
export function leaveEarlyShares(result: LeaveEarlyResult): LeaveEarlyShares {
  const total = result.depositBack + result.matchKept + result.matchReturned;
  if (total === 0) return { deposit: 0, kept: 0, returned: 0 };
  return {
    deposit: result.depositBack / total,
    kept: result.matchKept / total,
    returned: result.matchReturned / total,
  };
}
