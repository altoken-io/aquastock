import { describe, expect, it } from 'vitest';

import { faucetErrorKey } from './faucet';

describe('faucetErrorKey', () => {
  it('maps every code the faucet API sends', () => {
    expect(faucetErrorKey('already_funded')).toBe('alreadyFunded');
    expect(faucetErrorKey('faucet_rate_limited')).toBe('rateLimited');
    expect(faucetErrorKey('rate_limited')).toBe('rateLimited');
    expect(faucetErrorKey('faucet_empty')).toBe('empty');
    expect(faucetErrorKey('faucet_failed')).toBe('failed');
    expect(faucetErrorKey('faucet_unavailable')).toBe('unavailable');
  });

  it('falls back to a generic message for anything else, including a lost connection', () => {
    expect(faucetErrorKey('network')).toBe('generic');
    expect(faucetErrorKey('internal_error')).toBe('generic');
    expect(faucetErrorKey('__proto__')).toBe('generic');
    expect(faucetErrorKey('toString')).toBe('generic');
  });
});
