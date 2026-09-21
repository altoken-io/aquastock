// Shared helpers for the Solana scripts. Run with `pnpm exec tsx scripts/solana/<name>.ts`.
// Keypair files are read from disk on the machine running the script and never logged.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { Connection, Keypair, PublicKey } from '@solana/web3.js';

export function parseFlags(argv: string[]): Map<string, string> {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined || !arg.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      flags.set(arg.slice(2), 'true');
    } else {
      flags.set(arg.slice(2), next);
      i += 1;
    }
  }
  return flags;
}

function isSecretKey(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === 64 &&
    value.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
  );
}

export function loadKeypair(path: string): Keypair {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isSecretKey(parsed)) {
    throw new Error(`${path} is not a Solana keypair file`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(parsed));
}

export interface ScriptContext {
  flags: Map<string, string>;
  connection: Connection;
  wallet: Keypair;
}

/**
 * `--rpc` (or SOLANA_RPC_URL, default local validator) and `--wallet` (or ANCHOR_WALLET,
 * default ~/.config/solana/id.json).
 */
export function context(argv: string[]): ScriptContext {
  const flags = parseFlags(argv);
  const rpc =
    flags.get('rpc') ?? process.env.SOLANA_RPC_URL ?? 'http://127.0.0.1:8899';
  const walletPath =
    flags.get('wallet') ??
    process.env.ANCHOR_WALLET ??
    join(homedir(), '.config', 'solana', 'id.json');
  return {
    flags,
    connection: new Connection(rpc, 'confirmed'),
    wallet: loadKeypair(walletPath),
  };
}

export function requirePublicKey(
  flags: Map<string, string>,
  flag: string,
  envName?: string,
): PublicKey {
  const value = flags.get(flag) ?? (envName ? process.env[envName] : undefined);
  if (!value) {
    throw new Error(`missing --${flag}${envName ? ` (or ${envName})` : ''}`);
  }
  return new PublicKey(value);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
