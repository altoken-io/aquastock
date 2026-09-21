import { apiHandler, parseParam, readJsonBody } from '@/lib/api/handler';
import { addressSchema, saveMetadataBodySchema } from '@/lib/pools/schemas';
import { getPoolServices } from '@/lib/pools/server';
import { saveMetadata } from '@/lib/pools/service';

export const dynamic = 'force-dynamic';

/** Saves a pool's name and description. The body must carry the sponsor's signature. */
export function POST(
  request: Request,
  context: { params: Promise<{ address: string }> },
) {
  return apiHandler(request, { rateLimitKey: 'pool-metadata' }, async () => {
    const { address } = await context.params;
    const body = saveMetadataBodySchema.parse(await readJsonBody(request));
    return saveMetadata(
      getPoolServices(),
      parseParam(addressSchema, address),
      body,
    );
  });
}
