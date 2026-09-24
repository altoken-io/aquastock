// A scripted wallet for recording the live devnet app. The app detects wallets through the
// Wallet Standard (no per-wallet adapters), so the browser side is a small shim that registers
// one; every signature is made here in Node with `node:crypto`'s Ed25519, so the private key
// never enters the page. Keys are throwaway devnet keys funded by the app's own demo faucet.
import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  type JsonWebKey,
  type KeyObject,
} from 'node:crypto';

import type { BrowserContext } from 'playwright';

const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Bitcoin-style base58, the encoding Solana uses for addresses and signatures. */
export function base58(bytes: Uint8Array): string {
  // Base-58 digits, least significant first. Leading zero bytes are encoded as '1's below.
  const digits: number[] = [];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) {
      carry += (digits[i] ?? 0) << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let out = '';
  for (const byte of bytes) {
    if (byte !== 0) break;
    out += '1';
  }
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    out += BASE58_ALPHABET[digits[i] ?? 0];
  }
  return out;
}

export interface ScriptedWallet {
  /** Base58 address. */
  address: string;
  publicKey: Uint8Array;
  /** The private key as a JWK, so a resumed run reuses the same (already funded) wallet. */
  jwk: JsonWebKey;
  key: KeyObject;
}

export function walletFromJwk(jwk: JsonWebKey): ScriptedWallet {
  const key = createPrivateKey({ key: jwk, format: 'jwk' });
  const publicJwk = createPublicKey(key).export({ format: 'jwk' });
  if (typeof publicJwk.x !== 'string') {
    throw new Error('Ed25519 key without a public part');
  }
  const publicKey = new Uint8Array(Buffer.from(publicJwk.x, 'base64url'));
  return { address: base58(publicKey), publicKey, jwk, key };
}

export function newWallet(): ScriptedWallet {
  const { privateKey } = generateKeyPairSync('ed25519');
  return walletFromJwk(privateKey.export({ format: 'jwk' }));
}

/** Reads Solana's compact-u16 length prefix. */
function compactU16(bytes: Uint8Array, offset: number): [number, number] {
  let value = 0;
  for (let size = 0; size < 3; size += 1) {
    const byte = bytes[offset + size];
    if (byte === undefined) throw new Error('Truncated transaction');
    value |= (byte & 0x7f) << (size * 7);
    if ((byte & 0x80) === 0) return [value, size + 1];
  }
  throw new Error('Malformed compact-u16');
}

/**
 * Signs a serialized transaction (legacy or v0 wire format) as `wallet`: finds the wallet among
 * the message's required signers and writes its signature into that slot.
 */
export function signTransaction(
  wallet: ScriptedWallet,
  wire: Uint8Array,
): Uint8Array {
  const [signatureCount, prefix] = compactU16(wire, 0);
  const messageStart = prefix + signatureCount * 64;
  const message = wire.subarray(messageStart);
  const first = message[0];
  if (first === undefined) throw new Error('Empty message');
  // A versioned message starts with 0x80 | version; a legacy one starts with its header.
  const header = first & 0x80 ? 1 : 0;
  const requiredSigners = message[header] ?? 0;
  const [keyCount, keyPrefix] = compactU16(message, header + 3);
  const keysStart = header + 3 + keyPrefix;

  for (let index = 0; index < Math.min(keyCount, requiredSigners); index += 1) {
    const key = message.subarray(
      keysStart + index * 32,
      keysStart + (index + 1) * 32,
    );
    if (Buffer.from(key).equals(Buffer.from(wallet.publicKey))) {
      const signed = new Uint8Array(wire);
      signed.set(sign(null, message, wallet.key), prefix + index * 64);
      return signed;
    }
  }
  throw new Error(`${wallet.address} is not a signer of this transaction`);
}

export function signMessage(
  wallet: ScriptedWallet,
  message: Uint8Array,
): Uint8Array {
  return new Uint8Array(sign(null, message, wallet.key));
}

/** The name the app's connect dialog lists. */
export const WALLET_NAME = 'Test wallet';

// A plain teal disc: deliberately not the AquaStock mark, since this is not an AquaStock wallet.
const WALLET_ICON = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#1f6f7a"/><circle cx="16" cy="16" r="6" fill="#ffffff"/></svg>',
).toString('base64')}`;

interface ShimConfig {
  name: string;
  icon: string;
  address: string;
  publicKey: string;
}

/**
 * Registers the scripted wallet in every page of `context`. The page-side code only relays
 * bytes (as base64) to the `__aquastockSign` binding; Node does the signing.
 */
export async function installWallet(
  context: BrowserContext,
  wallet: ScriptedWallet,
): Promise<void> {
  await context.exposeBinding(
    '__aquastockSign',
    (_source, kind: unknown, payload: unknown): string => {
      if (typeof payload !== 'string') throw new Error('Expected base64');
      const bytes = new Uint8Array(Buffer.from(payload, 'base64'));
      const signed =
        kind === 'transaction'
          ? signTransaction(wallet, bytes)
          : signMessage(wallet, bytes);
      return Buffer.from(signed).toString('base64');
    },
  );

  const config: ShimConfig = {
    name: WALLET_NAME,
    icon: WALLET_ICON,
    address: wallet.address,
    publicKey: Buffer.from(wallet.publicKey).toString('base64'),
  };

  // Runs in the page, before any app script. Keep it dependency-free.
  await context.addInitScript((shim: ShimConfig) => {
    // Looked up per call: the binding is installed by Playwright, not by the page.
    const relay = async (kind: string, payload: string): Promise<string> => {
      const binding: unknown = Reflect.get(window, '__aquastockSign');
      if (typeof binding !== 'function') throw new Error('Signer missing');
      const result: unknown = await binding(kind, payload);
      if (typeof result !== 'string') throw new Error('Signer failed');
      return result;
    };
    const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
    const fromBase64 = (text: string) =>
      Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

    const chains = [
      'solana:devnet',
      'solana:mainnet',
      'solana:testnet',
      'solana:localnet',
    ] as const;
    const account = Object.freeze({
      address: shim.address,
      publicKey: fromBase64(shim.publicKey),
      chains,
      features: ['solana:signTransaction', 'solana:signMessage'] as const,
    });
    let connected = false;
    const listeners = new Set<(event: { accounts: unknown[] }) => void>();
    const emit = () => {
      for (const listener of listeners) listener({ accounts: wallet.accounts });
    };

    const wallet = {
      version: '1.0.0' as const,
      name: shim.name,
      icon: shim.icon,
      chains,
      get accounts() {
        return connected ? [account] : [];
      },
      features: {
        'standard:connect': {
          version: '1.0.0',
          connect: async () => {
            connected = true;
            emit();
            return { accounts: wallet.accounts };
          },
        },
        'standard:disconnect': {
          version: '1.0.0',
          disconnect: async () => {
            connected = false;
            emit();
          },
        },
        'standard:events': {
          version: '1.0.0',
          on: (
            _event: string,
            listener: (event: { accounts: unknown[] }) => void,
          ) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
          },
        },
        'solana:signTransaction': {
          version: '1.0.0',
          supportedTransactionVersions: ['legacy', 0],
          signTransaction: async (...inputs: { transaction: Uint8Array }[]) =>
            Promise.all(
              inputs.map(async ({ transaction }) => ({
                signedTransaction: fromBase64(
                  await relay('transaction', toBase64(transaction)),
                ),
              })),
            ),
        },
        'solana:signMessage': {
          version: '1.0.0',
          signMessage: async (...inputs: { message: Uint8Array }[]) =>
            Promise.all(
              inputs.map(async ({ message }) => ({
                signedMessage: message,
                signature: fromBase64(
                  await relay('message', toBase64(message)),
                ),
              })),
            ),
        },
      },
    };

    // The Wallet Standard registration handshake, both directions.
    const register = (api: unknown) => {
      const add: unknown =
        typeof api === 'object' && api !== null
          ? Reflect.get(api, 'register')
          : undefined;
      if (typeof add === 'function') add(wallet);
    };
    window.addEventListener('wallet-standard:app-ready', (event) => {
      register(Reflect.get(event, 'detail'));
    });
    window.dispatchEvent(
      new CustomEvent('wallet-standard:register-wallet', { detail: register }),
    );
  }, config);
}
