// Browser-side access to the Match Pools API. Errors keep the server's stable `code`, so
// screens can translate them instead of showing a raw message.
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function errorFrom(status: number, body: unknown): ApiClientError {
  if (typeof body === 'object' && body !== null) {
    const error: unknown = Reflect.get(body, 'error');
    if (typeof error === 'object' && error !== null) {
      const code: unknown = Reflect.get(error, 'code');
      const message: unknown = Reflect.get(error, 'message');
      if (typeof code === 'string') {
        return new ApiClientError(
          status,
          code,
          typeof message === 'string' ? message : code,
        );
      }
    }
  }
  return new ApiClientError(status, 'unknown', `request failed (${status})`);
}

export async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    // The browser could not reach our own server at all.
    throw new ApiClientError(0, 'network', 'network error');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw errorFrom(response.status, body);
  // Our own API's DTOs (packages/types); the server validated everything it sent.
  return body as T;
}

export const activityUrl = (
  address: string,
  cursor: string | null,
  limit = 20,
): string => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return `/api/pools/${address}/activity?${params.toString()}`;
};
