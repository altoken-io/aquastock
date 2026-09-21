import { apiHandler, parseParam, parseQuery } from '@/lib/api/handler';
import { activityQuerySchema, addressSchema } from '@/lib/pools/schemas';
import { getPoolServices } from '@/lib/pools/server';
import { listActivity } from '@/lib/pools/service';

export const dynamic = 'force-dynamic';

export function GET(
  request: Request,
  context: { params: Promise<{ address: string }> },
) {
  return apiHandler(
    request,
    { rateLimitKey: 'pool-activity', cache: 'publicRead' },
    async () => {
      const { address } = await context.params;
      return listActivity(
        getPoolServices(),
        parseParam(addressSchema, address),
        parseQuery(activityQuerySchema, request.url),
      );
    },
  );
}
