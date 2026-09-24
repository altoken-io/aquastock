import { apiHandler } from '@/lib/api/handler';
import { optionalServerEnv } from '@/lib/env/server';
import { getPoolServices } from '@/lib/pools/server';
import { getDeployment } from '@/lib/pools/service';
import { hermesBaseUrl } from '@/lib/price/pyth';
import { createMarketPrice } from '@/lib/price/source';

export const dynamic = 'force-dynamic';

// One per server instance, so a Pyth refusal is remembered between requests.
const marketPrice = createMarketPrice({
  pythKey: () => optionalServerEnv('PYTH_API_KEY'),
  hermesUrl: () => hermesBaseUrl(optionalServerEnv('PYTH_HERMES_URL')),
  // Read only when CoinGecko is needed: the live mint's multiplier (the devnet replica mirrors
  // the real SPYx's).
  multiplier: async () =>
    (await getDeployment(getPoolServices())).issuer?.multiplier ?? null,
});

/**
 * Live SPYx/USD for "≈ $" next to token amounts: Pyth when the deployment's key may read it,
 * otherwise Jupiter's keyless price, and CoinGecko's when Jupiter is down. The answer names its
 * `source`, and carries SPY's own price as `reference` when the source reports it. 503 only when
 * no source answers.
 */
export function GET(request: Request) {
  return apiHandler(
    request,
    { rateLimitKey: 'price', cache: 'publicRead' },
    () => marketPrice(Math.floor(Date.now() / 1000)),
  );
}
