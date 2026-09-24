import { ApiError } from '@/lib/api/errors';
import { apiHandler } from '@/lib/api/handler';
import { optionalServerEnv } from '@/lib/env/server';
import { fetchJupiterSpyxPrice } from '@/lib/price/jupiter';
import { fetchSpyxPrice, hermesBaseUrl } from '@/lib/price/pyth';

export const dynamic = 'force-dynamic';

/**
 * Live SPYx/USD for "≈ $" next to token amounts. Pyth when the deployment has a key it
 * accepts; otherwise Jupiter's keyless price, so a missing Pyth grant hides nothing. The answer
 * names its `source`. 503 only when both are unavailable.
 */
export function GET(request: Request) {
  return apiHandler(
    request,
    { rateLimitKey: 'price', cache: 'publicRead' },
    async () => {
      const now = Math.floor(Date.now() / 1000);
      const apiKey = optionalServerEnv('PYTH_API_KEY');
      if (apiKey) {
        try {
          return await fetchSpyxPrice(
            apiKey,
            now,
            fetch,
            hermesBaseUrl(optionalServerEnv('PYTH_HERMES_URL')),
          );
        } catch (error) {
          // Pyth already logged why; anything but "unavailable" is a bug and stays loud.
          if (!(error instanceof ApiError)) throw error;
        }
      }
      return fetchJupiterSpyxPrice(now);
    },
  );
}
