import { apiHandler, readJsonBody } from '@/lib/api/handler';
import { recordActivityBodySchema } from '@/lib/pools/schemas';
import { getPoolServices } from '@/lib/pools/server';
import { recordTransaction } from '@/lib/pools/service';

export const dynamic = 'force-dynamic';

/**
 * Asks the server to record a transaction's events. The server re-reads the transaction
 * from the chain, so a caller cannot invent activity; recording is idempotent.
 */
export function POST(request: Request) {
  return apiHandler(request, { rateLimitKey: 'record-activity' }, async () => {
    const { signature } = recordActivityBodySchema.parse(
      await readJsonBody(request),
    );
    return recordTransaction(getPoolServices(), signature);
  });
}
