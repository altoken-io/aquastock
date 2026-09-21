/**
 * Wall-clock unix seconds, for the server to stamp what it renders. Pages pass this to client
 * components so their first render matches the HTML, then the client's own clock takes over.
 * A named helper, not an inline `Date.now()`, so it is obviously per-request and never memoised.
 */
export function unixNow(): number {
  return Math.floor(Date.now() / 1_000);
}
