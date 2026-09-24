import { describe, expect, it } from 'vitest';

import { createInMemoryRateLimiter, refuseOnTimeout } from './rate-limit';

describe('createInMemoryRateLimiter', () => {
  it('allows requests up to the configured limit and rejects the next one', async () => {
    const rateLimit = createInMemoryRateLimiter({
      maxRequests: 2,
      now: () => 1_000,
      windowMs: 10_000,
    });

    await expect(rateLimit.limit('user-1')).resolves.toEqual({ success: true });
    await expect(rateLimit.limit('user-1')).resolves.toEqual({ success: true });
    await expect(rateLimit.limit('user-1')).resolves.toEqual({
      success: false,
    });
  });

  it('isolates identifiers and resets them after the window expires', async () => {
    let currentTime = 1_000;
    const rateLimit = createInMemoryRateLimiter({
      maxRequests: 1,
      now: () => currentTime,
      windowMs: 500,
    });

    await expect(rateLimit.limit('user-1')).resolves.toEqual({ success: true });
    await expect(rateLimit.limit('user-1')).resolves.toEqual({
      success: false,
    });
    await expect(rateLimit.limit('user-2')).resolves.toEqual({ success: true });

    currentTime += 500;

    await expect(rateLimit.limit('user-1')).resolves.toEqual({ success: true });
  });
});

describe('refuseOnTimeout', () => {
  // Upstash's own answer when Redis is slower than its timeout: allowed, reason "timeout".
  const upstashAnswer = (success: boolean, reason?: 'timeout') => ({
    limit: () =>
      Promise.resolve({
        success,
        limit: 0,
        remaining: 0,
        reset: 0,
        pending: Promise.resolve(),
        ...(reason ? { reason } : {}),
      }),
  });

  it('refuses when Upstash timed out, even though it said success', async () => {
    await expect(
      refuseOnTimeout(upstashAnswer(true, 'timeout')).limit('wallet'),
    ).resolves.toEqual({ success: false });
  });

  it('passes a real decision through unchanged', async () => {
    await expect(
      refuseOnTimeout(upstashAnswer(true)).limit('wallet'),
    ).resolves.toEqual({ success: true });
    await expect(
      refuseOnTimeout(upstashAnswer(false)).limit('wallet'),
    ).resolves.toEqual({ success: false });
  });
});
