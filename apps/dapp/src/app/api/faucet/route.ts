import { apiHandler, readJsonBody } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { getFaucetServices } from '@/lib/faucet/server';
import { drip } from '@/lib/faucet/service';
import { faucetBodySchema } from '@/lib/pools/schemas';
import { getIpFromHeaders } from '@/utils/ip';

export const dynamic = 'force-dynamic';
// Sending and confirming a transaction on a busy devnet can take a while.
export const maxDuration = 30;

/** Demo networks only: tops up a wallet with demo tokens and SOL for fees. */
export function POST(request: Request) {
  return apiHandler(request, { rateLimitKey: 'faucet' }, async () => {
    const faucet = getFaucetServices();
    if (!faucet) {
      throw new ApiError(
        404,
        'faucet_unavailable',
        'this deployment has no demo faucet',
      );
    }
    const { wallet } = faucetBodySchema.parse(await readJsonBody(request));
    return drip(faucet, wallet, getIpFromHeaders(request.headers) ?? 'unknown');
  });
}
