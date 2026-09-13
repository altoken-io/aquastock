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

// No accounts in AquaStock (pure wallet-connect) — this just links into the
// dApp itself rather than a login page.
export const DAPP_LOGIN_URL = DAPP_BASE_URL;
