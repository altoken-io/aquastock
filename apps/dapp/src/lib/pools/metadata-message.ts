// Client-safe: no node imports. The browser builds this exact text to sign, and the server
// rebuilds it from the request fields to verify.

export interface MetadataMessageFields {
  programId: string;
  pool: string;
  name: string;
  description: string | null;
  issuedAt: number;
}

/**
 * The exact text a wallet signs. A readable header, then one JSON object with a fixed key
 * order, so field boundaries are unambiguous however odd the description is.
 */
export function buildMetadataMessage(fields: MetadataMessageFields): string {
  return [
    'AquaStock wants you to update the details of a Match Pool.',
    'This does not move funds or change how the pool works.',
    '',
    JSON.stringify({
      program: fields.programId,
      pool: fields.pool,
      name: fields.name,
      description: fields.description,
      issuedAt: fields.issuedAt,
    }),
  ].join('\n');
}
