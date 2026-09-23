import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type RateLimitDecision = {
  success: boolean;
};

type RateLimiter = {
  limit: (identifier: string) => Promise<RateLimitDecision>;
};

type InMemoryRateLimiterOptions = {
  maxRequests?: number;
  now?: () => number;
  windowMs?: number;
};

type RateLimitWindow = {
  count: number;
  resetAt: number;
};

export const createInMemoryRateLimiter = ({
  maxRequests = 10,
  now = Date.now,
  windowMs = 10_000,
}: InMemoryRateLimiterOptions = {}): RateLimiter => {
  const windows = new Map<string, RateLimitWindow>();

  return {
    limit: async (identifier) => {
      const currentTime = now();
      const currentWindow = windows.get(identifier);

      if (!currentWindow || currentWindow.resetAt <= currentTime) {
        windows.set(identifier, {
          count: 1,
          resetAt: currentTime + windowMs,
        });
        return { success: true };
      }

      currentWindow.count += 1;
      return { success: currentWindow.count <= maxRequests };
    },
  };
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

const unavailableProductionRateLimit: RateLimiter = {
  // Missing production rate-limit infrastructure must never open the gate.
  limit: async () => ({ success: false }),
};

/**
 * False only in production with no Upstash credentials, where every limiter refuses every
 * request. Callers use it to report a misconfiguration instead of a misleading "slow down".
 */
export const rateLimitConfigured =
  redis !== null || process.env.NODE_ENV !== 'production';

export type RateLimiterOptions = {
  /** Namespaces the Upstash keys, so limiters with different budgets never share a counter. */
  prefix: string;
  requests: number;
  windowSeconds: number;
};

/**
 * A limiter with its own budget: Upstash when configured, in memory in development, and
 * closed in production without Upstash.
 */
export const createRateLimiter = ({
  prefix,
  requests,
  windowSeconds,
}: RateLimiterOptions): RateLimiter => {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
      prefix: `@altoken/ratelimit/${prefix}`,
      analytics: true,
    });
  }
  return process.env.NODE_ENV === 'production'
    ? unavailableProductionRateLimit
    : createInMemoryRateLimiter({
        maxRequests: requests,
        windowMs: windowSeconds * 1_000,
      });
};

// The general per-IP budget. Its Upstash prefix predates `createRateLimiter`, so it is kept
// as-is rather than resetting live counters.
export const rateLimit: RateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10s'),
      prefix: '@altoken/ratelimit',
      analytics: true,
    })
  : process.env.NODE_ENV === 'production'
    ? unavailableProductionRateLimit
    : createInMemoryRateLimiter();
