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
  /** The demo faucet, when this deployment runs one (never on mainnet). */
  faucet: FaucetInfoDto | null;
}

/** What one faucet request sends a wallet that needs it. */
export interface FaucetInfoDto {
  /** Tokens as a wallet shows them, for example "100". */
  tokens: string;
  /** SOL for fees, as a decimal string, for example "0.02". */
  sol: string;
}

/**
 * Where a market price came from: Pyth when the deployment's key may read SPYx, otherwise
 * Jupiter's public price, and CoinGecko's only when Jupiter is down too.
 */
export type PriceSource = 'pyth' | 'jupiter' | 'coingecko';

/** The price of what a tokenized stock tracks, so the token can be compared against it. */
export interface PriceReferenceDto {
  /** What the token follows, e.g. "SPY" for SPYx. */
  symbol: string;
  /** US dollars per share, as a decimal string. */
  price: string;
  /** Who publishes it, e.g. "xstocks". */
  source: string;
  /** Unix seconds of its last update. */
  updatedAt: number;
}

/** A live market price, for showing what token amounts are worth. */
export interface PriceDto {
  source: PriceSource;
  /** The pair, e.g. "SPYx/USD". */
  pair: string;
  /** The source's id for it: Pyth's feed id, or the mint Jupiter priced. */
  feedId: string;
  /** US dollars per token as a wallet shows it, as a decimal string. */
  price: string;
  /** Pyth's confidence interval, same units as `price`; null from Jupiter and CoinGecko. */
  confidence: string | null;
  /** Unix seconds when Pyth published this price, or when Jupiter's was read (it gives no time). */
  publishTime: number;
  /** SPY's own price, when the source reports it (Jupiter does, from xStocks); null otherwise. */
  reference: PriceReferenceDto | null;
}

/** What a faucet request actually sent. Amounts are decimal strings of raw units. */
export interface FaucetDripDto {
  signature: string;
  tokensRaw: string;
  lamports: string;
}
