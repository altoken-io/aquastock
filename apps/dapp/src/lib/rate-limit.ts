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

const remoteRateLimit =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(10, '10s'),
        prefix: '@altoken/ratelimit',
        analytics: true,
      })
    : null;

const unavailableProductionRateLimit: RateLimiter = {
  // Missing production rate-limit infrastructure must never open the gate.
  limit: async () => ({ success: false }),
};

/**
 * False only in production with no Upstash credentials, where `rateLimit` refuses every
 * request. Callers use it to report a misconfiguration instead of a misleading "slow down".
 */
export const rateLimitConfigured =
  remoteRateLimit !== null || process.env.NODE_ENV !== 'production';

export const rateLimit: RateLimiter =
  remoteRateLimit ??
  (process.env.NODE_ENV === 'production'
    ? unavailableProductionRateLimit
    : createInMemoryRateLimiter());
