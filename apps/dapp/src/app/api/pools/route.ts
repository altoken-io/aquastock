import { apiHandler, parseQuery } from '@/lib/api/handler';
import { listPoolsQuerySchema } from '@/lib/pools/schemas';
import { getPoolServices } from '@/lib/pools/server';
import { listPools } from '@/lib/pools/service';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return apiHandler(
    request,
    { rateLimitKey: 'pools', cache: 'publicRead' },
    () =>
      listPools(
        getPoolServices(),
        parseQuery(listPoolsQuerySchema, request.url),
      ),
  );
}
