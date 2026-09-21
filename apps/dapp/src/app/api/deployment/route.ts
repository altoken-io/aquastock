import { apiHandler } from '@/lib/api/handler';
import { getPoolServices } from '@/lib/pools/server';
import { getDeployment } from '@/lib/pools/service';

export const dynamic = 'force-dynamic';

/** Which program, network and mint this deployment uses, and what the issuer can do. */
export function GET(request: Request) {
  return apiHandler(
    request,
    { rateLimitKey: 'deployment', cache: 'publicRead' },
    () => getDeployment(getPoolServices()),
  );
}
