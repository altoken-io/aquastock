// How far a tokenized stock's market price sits from the stock it follows, for the "What you
// actually own" card. A token that stops following its fund is exactly the risk that card is
// about, so the gap is stated in words (above, below, level), never as colour alone.

export interface TrackingGap {
  direction: 'above' | 'below' | 'level';
  /** The size of the gap as a share of the reference, e.g. 0.0007 for 0.07%. Zero when level. */
  share: number;
}

/** Under this, a gap rounds to 0.00% and is shown as level. */
const LEVEL_BELOW = 0.00005;

/** The token's price against the reference, both decimal strings; null if either is unusable. */
export function trackingGap(
  price: string,
  reference: string,
): TrackingGap | null {
  const token = Number(price);
  const fund = Number(reference);
  if (!Number.isFinite(token) || !Number.isFinite(fund)) return null;
  if (token <= 0 || fund <= 0) return null;
  const share = (token - fund) / fund;
  if (Math.abs(share) < LEVEL_BELOW) return { direction: 'level', share: 0 };
  return { direction: share > 0 ? 'above' : 'below', share: Math.abs(share) };
}
