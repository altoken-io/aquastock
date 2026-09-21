// Builds a replica of the mainnet SPYx mint (Token-2022): scaled UI amount, pausable,
// permanent delegate, default account state, a transfer hook with no program,
// confidential transfer, metadata pointer and token metadata. The payer holds every
// authority, so it acts as the "issuer" of the demo asset.
import { createHash } from 'node:crypto';

import {
  AccountState,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeDefaultAccountStateInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMint2Instruction,
  createInitializePausableConfigInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeScaledUiAmountConfigInstruction,
  createInitializeTransferHookInstruction,
  getMintLen,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

export interface ReplicaOptions {
  name: string;
  symbol: string;
  uri: string;
  /** Starting display multiplier, as the mainnet mint has ~1.0057. */
  multiplier: number;
}

export const DEFAULT_REPLICA: ReplicaOptions = {
  name: 'SPYx (AquaStock demo replica)',
  symbol: 'dSPYx',
  uri: '',
  multiplier: 1.005714560286254,
};

export const REPLICA_DECIMALS = 8;

const EXTENSIONS = [
  ExtensionType.MetadataPointer,
  ExtensionType.PermanentDelegate,
  ExtensionType.DefaultAccountState,
  ExtensionType.ScaledUiAmountConfig,
  ExtensionType.PausableConfig,
  ExtensionType.TransferHook,
  ExtensionType.ConfidentialTransferMint,
];

/**
 * ConfidentialTransferInstruction::InitializeMint. Layout checked against the Rust
 * builder: [27, 0, authority(32), auto_approve(1), auditor(32)].
 */
function confidentialTransferInitializeMint(
  mint: PublicKey,
  authority: PublicKey,
): TransactionInstruction {
  const data = new Uint8Array(67);
  data[0] = 27; // TokenInstruction::ConfidentialTransferExtension
  data[1] = 0; // InitializeMint
  data.set(authority.toBytes(), 2);
  // auto_approve_new_accounts = false and no auditor: the remaining bytes stay zero.
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [{ pubkey: mint, isSigner: false, isWritable: true }],
    data: Buffer.from(data),
  });
}

function borshString(value: string): Buffer {
  const bytes = Buffer.from(value, 'utf8');
  const length = Buffer.alloc(4);
  length.writeUInt32LE(bytes.length);
  return Buffer.concat([length, bytes]);
}

/** spl-token-metadata-interface `Initialize`, discriminated by a sha256 prefix. */
function tokenMetadataInitialize(
  mint: PublicKey,
  updateAuthority: PublicKey,
  mintAuthority: PublicKey,
  options: ReplicaOptions,
): TransactionInstruction {
  const discriminator = createHash('sha256')
    .update('spl_token_metadata_interface:initialize_account')
    .digest()
    .subarray(0, 8);
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: updateAuthority, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: mintAuthority, isSigner: true, isWritable: false },
    ],
    data: Buffer.concat([
      discriminator,
      borshString(options.name),
      borshString(options.symbol),
      borshString(options.uri),
    ]),
  });
}

/** TLV bytes the variable-length metadata adds: header, two keys, three strings, empty vec. */
function metadataLength(options: ReplicaOptions): number {
  const strings = [options.name, options.symbol, options.uri].reduce(
    (total, value) => total + 4 + Buffer.byteLength(value, 'utf8'),
    0,
  );
  return 4 + 32 + 32 + strings + 4;
}

/** Creates the mint and returns its address. The mint's own keypair is never stored. */
export async function createReplicaMint(
  connection: Connection,
  payer: Keypair,
  options: ReplicaOptions = DEFAULT_REPLICA,
): Promise<PublicKey> {
  const mint = Keypair.generate();
  const authority = payer.publicKey;
  const space = getMintLen(EXTENSIONS);
  // The account grows when metadata is written, so it is funded for its final size.
  const lamports = await connection.getMinimumBalanceForRentExemption(
    space + metadataLength(options),
  );

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: authority,
      newAccountPubkey: mint.publicKey,
      lamports,
      space,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      mint.publicKey,
      authority,
      mint.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializePermanentDelegateInstruction(
      mint.publicKey,
      authority,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeDefaultAccountStateInstruction(
      mint.publicKey,
      AccountState.Initialized,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeScaledUiAmountConfigInstruction(
      mint.publicKey,
      authority,
      options.multiplier,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializePausableConfigInstruction(
      mint.publicKey,
      authority,
      TOKEN_2022_PROGRAM_ID,
    ),
    // The default (all zero) key means "no hook program".
    createInitializeTransferHookInstruction(
      mint.publicKey,
      authority,
      PublicKey.default,
      TOKEN_2022_PROGRAM_ID,
    ),
    confidentialTransferInitializeMint(mint.publicKey, authority),
    createInitializeMint2Instruction(
      mint.publicKey,
      REPLICA_DECIMALS,
      authority,
      authority,
      TOKEN_2022_PROGRAM_ID,
    ),
    tokenMetadataInitialize(mint.publicKey, authority, authority, options),
  );
  await sendAndConfirmTransaction(connection, transaction, [payer, mint]);
  return mint.publicKey;
}
