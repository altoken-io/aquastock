// Transport shapes for Match Pools. Amounts are decimal strings of raw token units (a u64
// does not fit in a JS number), and times are unix seconds unless a name says otherwise.
// The chain is the source of truth for every number here.

export interface PoolMetadataDto {
  name: string;
  description: string | null;
}

export interface PoolDto {
  address: string;
  sponsor: string;
  mint: string;
  poolId: string;
  matchBps: number;
  perSaverCap: string;
  vestingSeconds: number;
  createdAt: number;
  endsAt: number;
  budgetTotal: string;
  reserved: string;
  claimed: string;
  depositsTotal: string;
  /** budgetTotal - reserved: match nobody has a claim on yet. */
  unreserved: string;
  /** Null until the sponsor (or the first recorded activity) registers a row. */
  metadata: PoolMetadataDto | null;
}

export interface PositionDto {
  address: string;
  pool: string;
  saver: string;
  deposited: string;
  matchReserved: string;
  matchClaimed: string;
  startedAt: number;
  settled: boolean;
  /** Vested match as of `asOf`, computed from on-chain fields and the program's rules. */
  vested: string;
  /** What a claim would pay as of `asOf`. Only the chain says what was actually claimed. */
  claimable: string;
  asOf: number;
}

/** A saver's position with the pool it belongs to, for the "my match" screen. */
export interface MyPositionDto {
  position: PositionDto;
  pool: PoolDto;
}

export type PoolActivityKind =
  | 'POOL_CREATED'
  | 'MATCH_FUNDED'
  | 'DEPOSITED'
  | 'CLAIMED'
  | 'WITHDRAWN'
  | 'UNMATCHED_RECLAIMED'
  | 'POSITION_CLOSED';

export interface PoolActivityDto {
  id: string;
  kind: PoolActivityKind;
  wallet: string;
  amount: string | null;
  matchAmount: string | null;
  txSignature: string;
  /** ISO 8601. */
  occurredAt: string;
}

export interface PoolActivityPageDto {
  items: PoolActivityDto[];
  /** Opaque; pass back as `cursor` for the next page. Null when there is no more. */
  nextCursor: string | null;
}

/**
 * What the token's issuer can do, read live from the mint. The UI shows this as "what you
 * actually own", so it must reflect the chain and never a cached assumption.
 */
export interface IssuerPowersDto {
  mint: string;
  decimals: number;
  /** From the mint's on-chain metadata; null if it has none. */
  symbol: string | null;
  name: string | null;
  paused: boolean;
  pauseAuthority: string | null;
  freezeAuthority: string | null;
  permanentDelegate: string | null;
  transferHookProgram: string | null;
  /** Current display multiplier as a decimal string, and any scheduled change. */
  multiplier: string;
  pendingMultiplier: string | null;
  pendingMultiplierEffectiveAt: number | null;
}

export interface DeploymentDto {
  programId: string;
  network: string;
  /** The single mint this deployment allows, from the on-chain Config. Null before init. */
  allowedMint: string | null;
  upgradeAuthority: string | null;
  issuer: IssuerPowersDto | null;
}
