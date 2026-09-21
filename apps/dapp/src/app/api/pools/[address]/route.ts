import { apiHandler, parseParam, parseQuery } from '@/lib/api/handler';
import { addressSchema, poolDetailQuerySchema } from '@/lib/pools/schemas';
import { getPoolServices } from '@/lib/pools/server';
import { getPoolDetail } from '@/lib/pools/service';

export const dynamic = 'force-dynamic';

export function GET(
  request: Request,
  context: { params: Promise<{ address: string }> },
) {
  return apiHandler(request, { rateLimitKey: 'pool-detail' }, async () => {
    const { address } = await context.params;
    const query = parseQuery(poolDetailQuerySchema, request.url);
    return getPoolDetail(
      getPoolServices(),
      parseParam(addressSchema, address),
      query.wallet,
    );
  });
}
