// Shared plumbing for route handlers: rate limiting, input parsing, and error mapping. A
// handler only says what it needs; nothing internal ever reaches a caller.
import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';

import { rateLimit, rateLimitConfigured } from '@/lib/rate-limit';
import { getIpFromHeaders } from '@/utils/ip';

import { ApiError } from './errors';

const MAX_BODY_BYTES = 8_192;

/** Public reads may be cached briefly at the edge; wallet-specific reads and writes never. */
const CACHE_CONTROL = {
  publicRead: 'public, s-maxage=3, stale-while-revalidate=10',
  private: 'no-store',
} as const;

export interface HandlerOptions {
  /** Names the route in the rate-limit key, so routes do not share a budget. */
  rateLimitKey: string;
  cache?: keyof typeof CACHE_CONTROL;
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...extra } },
    { status, headers: { 'Cache-Control': 'no-store', ...headers } },
  );
}

export async function apiHandler(
  request: Request,
  options: HandlerOptions,
  run: () => Promise<unknown>,
): Promise<NextResponse> {
  if (!rateLimitConfigured) {
    // Production without Upstash credentials: the limiter refuses everything by design.
    // Say so plainly, since "too many requests" would send someone chasing the wrong thing.
    console.error(
      'rate limiter is not configured: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN',
    );
    return errorResponse(
      503,
      'rate_limiter_unavailable',
      'the service is not fully configured yet',
    );
  }
  const ip = getIpFromHeaders(request.headers) ?? 'unknown';
  const decision = await rateLimit.limit(`${ip}:${options.rateLimitKey}`);
  if (!decision.success) {
    return errorResponse(
      429,
      'rate_limited',
      'too many requests; try again shortly',
      {},
      {
        'Retry-After': '10',
      },
    );
  }

  try {
    const data = await run();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': CACHE_CONTROL[options.cache ?? 'private'] },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.status, error.code, error.message);
    }
    if (error instanceof ZodError) {
      return errorResponse(400, 'invalid_request', 'the request is not valid', {
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    // Details stay in the server log; callers get nothing they could use to probe.
    console.error('api handler failed', options.rateLimitKey, error);
    return errorResponse(500, 'internal_error', 'something went wrong');
  }
}

/** Parses query parameters with a schema. Repeated keys keep the last value. */
export function parseQuery<T>(schema: ZodType<T>, url: string): T {
  return schema.parse(Object.fromEntries(new URL(url).searchParams));
}

export function parseParam<T>(schema: ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

/** Reads a small JSON body, refusing other content types and oversized payloads. */
export async function readJsonBody(request: Request): Promise<unknown> {
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .includes('application/json')
  ) {
    throw new ApiError(
      415,
      'unsupported_media_type',
      'send the body as application/json',
    );
  }
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) {
    throw new ApiError(
      413,
      'payload_too_large',
      'the request body is too large',
    );
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new ApiError(
      413,
      'payload_too_large',
      'the request body is too large',
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(
      400,
      'invalid_json',
      'the request body is not valid JSON',
    );
  }
}
