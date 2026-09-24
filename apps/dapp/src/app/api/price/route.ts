import { ApiError } from '@/lib/api/errors';
import { apiHandler } from '@/lib/api/handler';
import { optionalServerEnv } from '@/lib/env/server';
import { fetchSpyxPrice, hermesBaseUrl } from '@/lib/price/pyth';

export const dynamic = 'force-dynamic';

/** Live SPYx/USD from Pyth, for "≈ $" next to token amounts. Off without PYTH_API_KEY. */
export function GET(request: Request) {
  return apiHandler(
    request,
    { rateLimitKey: 'price', cache: 'publicRead' },
    async () => {
      const apiKey = optionalServerEnv('PYTH_API_KEY');
      if (!apiKey) {
        throw new ApiError(
          404,
          'price_unavailable',
          'this deployment shows no market prices',
        );
      }
      return fetchSpyxPrice(
        apiKey,
        Math.floor(Date.now() / 1000),
        fetch,
        hermesBaseUrl(optionalServerEnv('PYTH_HERMES_URL')),
      );
    },
  );
}
