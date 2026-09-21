// Program-derived addresses for the Match Pools program. Relative imports only, so
// the same file runs in the browser, in route handlers and in `scripts/solana`.
import { PublicKey } from '@solana/web3.js';

const encoder = new TextEncoder();

const BPF_LOADER_UPGRADEABLE = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111',
);

const U64_MAX = 0xffff_ffff_ffff_ffffn;

/** Little-endian u64, matching `pool_id.to_le_bytes()` in the program. */
export function u64ToLeBytes(value: bigint): Uint8Array {
  if (value < 0n || value > U64_MAX) {
    throw new RangeError('value must fit in an unsigned 64-bit integer');
  }
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, value, true);
  return bytes;
}

function derive(seeds: Uint8Array[], programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export function configPda(programId: PublicKey): PublicKey {
  return derive([encoder.encode('config')], programId);
}

export function poolPda(
  programId: PublicKey,
  sponsor: PublicKey,
  poolId: bigint,
): PublicKey {
  return derive(
    [encoder.encode('pool'), sponsor.toBytes(), u64ToLeBytes(poolId)],
    programId,
  );
}

export function vaultPda(programId: PublicKey, pool: PublicKey): PublicKey {
  return derive([encoder.encode('vault'), pool.toBytes()], programId);
}

export function positionPda(
  programId: PublicKey,
  pool: PublicKey,
  saver: PublicKey,
): PublicKey {
  return derive(
    [encoder.encode('position'), pool.toBytes(), saver.toBytes()],
    programId,
  );
}

/** The loader's record of the program, which holds its upgrade authority. */
export function programDataPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [programId.toBytes()],
    BPF_LOADER_UPGRADEABLE,
  )[0];
}
