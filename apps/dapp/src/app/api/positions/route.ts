import { apiHandler, parseQuery } from '@/lib/api/handler';
import { walletQuerySchema } from '@/lib/pools/schemas';
import { getPoolServices } from '@/lib/pools/server';
import { getPositions } from '@/lib/pools/service';

export const dynamic = 'force-dynamic';

/** A wallet's positions across pools, with vesting computed from the on-chain rules. */
export function GET(request: Request) {
  return apiHandler(request, { rateLimitKey: 'positions' }, async () => {
    const { wallet } = parseQuery(walletQuerySchema, request.url);
    return { positions: await getPositions(getPoolServices(), wallet) };
  });
}
