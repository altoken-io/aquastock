// Read-only access to the Match Pools program. Nothing here signs or sends anything: the
// chain is the source of truth, and every write is a transaction a user's wallet signs.
import { AnchorProvider } from '@anchor-lang/core';
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getExtensionData,
  getMint,
  getPausableConfig,
  getPermanentDelegate,
  getScaledUiAmountConfig,
  getTransferHook,
} from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

import type { DeploymentDto, IssuerPowersDto } from '@aquastock/types';

import { configPda, programDataPda } from '../solana/pdas';
import {
  createMatchPoolsProgram,
  type MatchPoolsProgram,
} from '../solana/program';

export interface ChainClient {
  connection: Connection;
  program: MatchPoolsProgram;
  programId: PublicKey;
}

/** A wallet that cannot sign, so this client can never move funds. */
// (`Wallet` from the package is the Node keypair class, so take the provider's own type.)
type ProviderWallet = ConstructorParameters<typeof AnchorProvider>[1];

const READ_ONLY_WALLET: ProviderWallet = {
  publicKey: PublicKey.default,
  signTransaction: () => Promise.reject(new Error('read-only client')),
  signAllTransactions: () => Promise.reject(new Error('read-only client')),
};

export function createChainClient(
  rpcUrl: string,
  programId: PublicKey,
): ChainClient {
  const connection = new Connection(rpcUrl, 'confirmed');
  const provider = new AnchorProvider(connection, READ_ONLY_WALLET, {
    commitment: 'confirmed',
  });
  return {
    connection,
    program: createMatchPoolsProgram(provider, programId),
    programId,
  };
}

export interface ChainPool {
  address: PublicKey;
  sponsor: PublicKey;
  mint: PublicKey;
  vault: PublicKey;
  poolId: bigint;
  matchBps: number;
  perSaverCap: bigint;
  vestingSeconds: number;
  createdAt: number;
  endsAt: number;
  budgetTotal: bigint;
  reserved: bigint;
  claimed: bigint;
  depositsTotal: bigint;
}

export interface ChainPosition {
  address: PublicKey;
  pool: PublicKey;
  saver: PublicKey;
  deposited: bigint;
  matchReserved: bigint;
  matchClaimed: bigint;
  startedAt: number;
  settled: boolean;
}

type Numeric = { toString(): string };

const big = (value: Numeric): bigint => BigInt(value.toString());

function seconds(value: Numeric): number {
  const parsed = Number(value.toString());
  if (!Number.isSafeInteger(parsed)) {
    throw new RangeError('on-chain timestamp is out of range');
  }
  return parsed;
}

function toChainPool(
  address: PublicKey,
  account: Awaited<ReturnType<MatchPoolsProgram['account']['pool']['fetch']>>,
): ChainPool {
  return {
    address,
    sponsor: account.sponsor,
    mint: account.mint,
    vault: account.vault,
    poolId: big(account.poolId),
    matchBps: account.matchBps,
    perSaverCap: big(account.perSaverCap),
    vestingSeconds: seconds(account.vestingSeconds),
    createdAt: seconds(account.createdAt),
    endsAt: seconds(account.endsAt),
    budgetTotal: big(account.budgetTotal),
    reserved: big(account.reserved),
    claimed: big(account.claimed),
    depositsTotal: big(account.depositsTotal),
  };
}

function toChainPosition(
  address: PublicKey,
  account: Awaited<
    ReturnType<MatchPoolsProgram['account']['position']['fetch']>
  >,
): ChainPosition {
  return {
    address,
    pool: account.pool,
    saver: account.saver,
    deposited: big(account.deposited),
    matchReserved: big(account.matchReserved),
    matchClaimed: big(account.matchClaimed),
    startedAt: seconds(account.startedAt),
    settled: account.settled,
  };
}

/** Every pool of this deployment. Fine at demo scale; paginate or index before scaling. */
export async function fetchPools(client: ChainClient): Promise<ChainPool[]> {
  const accounts = await client.program.account.pool.all();
  return accounts.map(({ publicKey, account }) =>
    toChainPool(publicKey, account),
  );
}

type PoolAccount = Awaited<
  ReturnType<MatchPoolsProgram['account']['pool']['fetch']>
>;
type PositionAccount = Awaited<
  ReturnType<MatchPoolsProgram['account']['position']['fetch']>
>;

/**
 * Reads an account only if this program owns it and it decodes as the expected type. Anchor's
 * own `fetchNullable` returns null for a missing account but THROWS for an account owned by
 * another program (the System Program, a wallet, someone else's data), which would turn a
 * harmless "that is not a pool" into a server error.
 */
async function fetchProgramAccount<T>(
  client: ChainClient,
  address: PublicKey,
  decode: (data: Buffer) => T,
): Promise<T | null> {
  const info = await client.connection.getAccountInfo(address, 'confirmed');
  if (!info || !info.owner.equals(client.programId)) return null;
  try {
    // Fails on a wrong discriminator, so another account type is never read as this one.
    return decode(info.data);
  } catch {
    return null;
  }
}

export async function fetchPool(
  client: ChainClient,
  address: PublicKey,
): Promise<ChainPool | null> {
  const account = await fetchProgramAccount(client, address, (data) =>
    client.program.coder.accounts.decode<PoolAccount>('pool', data),
  );
  return account ? toChainPool(address, account) : null;
}

// Offset of `saver` in a Position account: 8-byte discriminator, then the 32-byte pool.
const POSITION_SAVER_OFFSET = 8 + 32;

export async function fetchPositionsForWallet(
  client: ChainClient,
  wallet: PublicKey,
): Promise<ChainPosition[]> {
  const accounts = await client.program.account.position.all([
    { memcmp: { offset: POSITION_SAVER_OFFSET, bytes: wallet.toBase58() } },
  ]);
  return accounts.map(({ publicKey, account }) =>
    toChainPosition(publicKey, account),
  );
}

export async function fetchPositionForWallet(
  client: ChainClient,
  pool: PublicKey,
  position: PublicKey,
): Promise<ChainPosition | null> {
  const account = await fetchProgramAccount(client, position, (data) =>
    client.program.coder.accounts.decode<PositionAccount>('position', data),
  );
  if (!account || !account.pool.equals(pool)) return null;
  return toChainPosition(position, account);
}

/** Decimal string for a display multiplier, without exponent notation. */
export function multiplierToString(value: number): string {
  return value.toFixed(15).replace(/0+$/, '').replace(/\.$/, '.0');
}

const optionalKey = (key: PublicKey | null | undefined): string | null =>
  key && !key.equals(PublicKey.default) ? key.toBase58() : null;

export interface TokenLabels {
  name: string | null;
  symbol: string | null;
}

/**
 * Reads name and symbol from the TokenMetadata extension value: update authority (32), mint
 * (32), then borsh strings name, symbol, uri. Returns nulls for anything malformed rather
 * than throwing, since a token without readable metadata is still a usable token.
 */
export function parseTokenLabels(data: Uint8Array | null): TokenLabels {
  const empty: TokenLabels = { name: null, symbol: null };
  if (!data || data.length < 72) return empty;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let offset = 64;
  const readString = (): string | null => {
    if (offset + 4 > data.length) return null;
    const length = view.getUint32(offset, true);
    offset += 4;
    if (length > 256 || offset + length > data.length) return null;
    try {
      const text = decoder.decode(data.subarray(offset, offset + length));
      offset += length;
      return text;
    } catch {
      return null;
    }
  };
  const name = readString();
  const symbol = name === null ? null : readString();
  return {
    name: name?.trim() ? name.trim() : null,
    symbol: symbol?.trim() ? symbol.trim() : null,
  };
}

/** What the token's issuer can do, read live from the mint. */
export async function fetchIssuerPowers(
  connection: Connection,
  mintAddress: PublicKey,
  now: number,
): Promise<IssuerPowersDto> {
  const mint = await getMint(
    connection,
    mintAddress,
    'confirmed',
    TOKEN_2022_PROGRAM_ID,
  );
  const pausable = getPausableConfig(mint);
  const scaled = getScaledUiAmountConfig(mint);
  const hook = getTransferHook(mint);
  const delegate = getPermanentDelegate(mint);

  const effectiveAt = scaled
    ? Number(scaled.newMultiplierEffectiveTimestamp)
    : 0;
  const scheduled = scaled !== null && effectiveAt > now;
  const current = scaled
    ? scaled.newMultiplierEffectiveTimestamp <= BigInt(now)
      ? scaled.newMultiplier
      : scaled.multiplier
    : 1;

  const labels = parseTokenLabels(
    getExtensionData(ExtensionType.TokenMetadata, mint.tlvData),
  );
  return {
    mint: mintAddress.toBase58(),
    decimals: mint.decimals,
    symbol: labels.symbol,
    name: labels.name,
    paused: pausable?.paused ?? false,
    pauseAuthority: optionalKey(pausable?.authority),
    freezeAuthority: optionalKey(mint.freezeAuthority),
    permanentDelegate: optionalKey(delegate?.delegate),
    transferHookProgram: optionalKey(hook?.programId),
    multiplier: multiplierToString(current),
    pendingMultiplier:
      scheduled && scaled ? multiplierToString(scaled.newMultiplier) : null,
    pendingMultiplierEffectiveAt: scheduled ? effectiveAt : null,
  };
}

/** The upgrade authority, from the loader's programdata account. Null once burned. */
export async function fetchUpgradeAuthority(
  client: ChainClient,
): Promise<string | null> {
  const account = await client.connection.getAccountInfo(
    programDataPda(client.programId),
    'confirmed',
  );
  // Header: 4-byte tag (3), 8-byte slot, then Option<Pubkey>.
  if (
    !account ||
    account.data.length < 45 ||
    account.data.readUInt32LE(0) !== 3
  ) {
    return null;
  }
  return account.data[12] === 1
    ? new PublicKey(account.data.subarray(13, 45)).toBase58()
    : null;
}

export async function fetchDeployment(
  client: ChainClient,
  network: string,
  fallbackMint: PublicKey | null,
  now: number,
): Promise<DeploymentDto> {
  const config = await client.program.account.config.fetchNullable(
    configPda(client.programId),
  );
  const mint = config?.allowedMint ?? fallbackMint;
  const [upgradeAuthority, issuer] = await Promise.all([
    fetchUpgradeAuthority(client),
    mint
      ? fetchIssuerPowers(client.connection, mint, now)
      : Promise.resolve(null),
  ]);
  return {
    programId: client.programId.toBase58(),
    network,
    allowedMint: config ? config.allowedMint.toBase58() : null,
    upgradeAuthority,
    issuer,
  };
}
