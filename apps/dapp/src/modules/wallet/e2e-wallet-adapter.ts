// A wallet for automated tests and headless browsers, where no extension exists. It signs with
// a throwaway key that is public by construction (it lives in a NEXT_PUBLIC variable), so it is
// only ever registered against a local validator: see `providers/solana-provider.tsx`, which
// refuses any other network, and `next.config.ts`, which compiles it out of production builds.
import {
  BaseMessageSignerWalletAdapter,
  WalletReadyState,
  isVersionedTransaction,
  type SupportedTransactionVersions,
  type WalletName,
} from '@solana/wallet-adapter-base';
import {
  Keypair,
  type PublicKey,
  type Transaction,
  type VersionedTransaction,
} from '@solana/web3.js';

// The library types wallet names as a branded string; this is its documented way to make one.
export const E2E_WALLET_NAME =
  'E2E Test Wallet' as WalletName<'E2E Test Wallet'>;

const ICON =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiMwYzc0ODkiLz48L3N2Zz4=';

// DER prefix that wraps a 32-byte Ed25519 seed as a PKCS#8 private key.
const PKCS8_ED25519_PREFIX = Uint8Array.from([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04,
  0x22, 0x04, 0x20,
]);

/** Parses a Solana keypair file's JSON (an array of 64 bytes). Null for anything else. */
export function parseSecretKey(json: string): Uint8Array | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (
      Array.isArray(parsed) &&
      parsed.length === 64 &&
      parsed.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
    ) {
      return Uint8Array.from(parsed);
    }
  } catch {
    // Not JSON: fall through.
  }
  return null;
}

export class E2eWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = E2E_WALLET_NAME;
  url = 'https://aquastock.io';
  icon = ICON;
  supportedTransactionVersions: SupportedTransactionVersions = new Set([
    'legacy',
    0,
  ]);
  readonly readyState = WalletReadyState.Installed;

  private readonly keypair: Keypair;
  private account: PublicKey | null = null;

  constructor(secretKey: Uint8Array) {
    super();
    this.keypair = Keypair.fromSecretKey(secretKey);
  }

  get publicKey(): PublicKey | null {
    return this.account;
  }

  get connecting(): boolean {
    return false;
  }

  connect(): Promise<void> {
    this.account = this.keypair.publicKey;
    this.emit('connect', this.account);
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    this.account = null;
    this.emit('disconnect');
    return Promise.resolve();
  }

  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> {
    if (isVersionedTransaction(transaction)) {
      transaction.sign([this.keypair]);
    } else {
      transaction.partialSign(this.keypair);
    }
    return Promise.resolve(transaction);
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]> {
    return Promise.all(transactions.map((tx) => this.signTransaction(tx)));
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      Uint8Array.from([
        ...PKCS8_ED25519_PREFIX,
        ...this.keypair.secretKey.slice(0, 32),
      ]),
      { name: 'Ed25519' },
      false,
      ['sign'],
    );
    // Copy into a fresh buffer: WebCrypto's types want an ArrayBuffer-backed array.
    return new Uint8Array(
      await crypto.subtle.sign('Ed25519', key, new Uint8Array(message)),
    );
  }
}
