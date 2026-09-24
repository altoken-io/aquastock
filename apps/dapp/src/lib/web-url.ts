// Plain env-derived constant — mirrors apps/web/src/lib/dapp-url.ts in the
// other direction: the marketing site to send a visitor back to when they
// land here before the real product exists.
export const WEB_BASE_URL = process.env.NEXT_PUBLIC_WEB_URL?.startsWith('http')
  ? process.env.NEXT_PUBLIC_WEB_URL
  : 'https://aquastock.io';

/** The marketing site's host, for link text that has to name where the link goes. */
export const WEB_HOST = new URL(WEB_BASE_URL).host;
