// Maps the faucet API's stable error codes to the copy a person sees.
export type FaucetErrorKey =
  | 'alreadyFunded'
  | 'rateLimited'
  | 'empty'
  | 'failed'
  | 'unavailable'
  | 'generic';

// A Map, not an object literal, so a code like `__proto__` cannot resolve to a prototype.
const BY_CODE: ReadonlyMap<string, FaucetErrorKey> = new Map([
  ['already_funded', 'alreadyFunded'],
  ['faucet_rate_limited', 'rateLimited'],
  ['rate_limited', 'rateLimited'],
  ['faucet_empty', 'empty'],
  ['faucet_failed', 'failed'],
  ['faucet_unavailable', 'unavailable'],
]);

export function faucetErrorKey(code: string): FaucetErrorKey {
  return BY_CODE.get(code) ?? 'generic';
}
