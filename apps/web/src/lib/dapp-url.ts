// Plain env-derived constants — deliberately not in a 'use client' module.
// Server Components (e.g. footer.tsx) need to read these values directly;
// every export from a 'use client' file becomes an opaque client reference
// to server code, which throws at render time if actually read rather than
// just passed through as a prop.
export const DAPP_BASE_URL = process.env.NEXT_PUBLIC_DAPP_URL?.startsWith(
  'http',
)
  ? process.env.NEXT_PUBLIC_DAPP_URL
  : 'https://app.aquastock.io';

/**
 * The product's front door: the pool list, where savers and sponsors connect a wallet. Never
 * link to the dApp's bare `/`, which is the staff sign-in page.
 */
export const dappPoolsUrl = (locale: string): string =>
  `${DAPP_BASE_URL}/${encodeURIComponent(locale)}/pools`;
