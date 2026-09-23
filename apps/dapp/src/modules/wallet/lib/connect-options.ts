// Pure decisions for the connect dialog: which kind of device this is, and where a person
// without a wallet in this browser should go next.

/** Wallet-adapter's own name for the Android Mobile Wallet Adapter. */
export const MOBILE_WALLET_ADAPTER_NAME = 'Mobile Wallet Adapter';

/**
 * Phones and tablets, where no browser extension can exist. iPadOS reports a desktop Safari
 * user agent, so it is recognised by touch support on a "Macintosh".
 */
export function isMobileDevice(userAgent: string, maxTouchPoints = 0): boolean {
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return true;
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

export type ConnectMode =
  /** Wallets are here: an extension, or a wallet app's own browser. Pick one. */
  | 'choose'
  /** A phone browser: open this page inside a wallet app (or use one on Android). */
  | 'open-in-app'
  /** A desktop browser without a wallet: install one. */
  | 'install';

export function connectMode(input: {
  mobile: boolean;
  /** Wallets reporting Installed, other than the Mobile Wallet Adapter. */
  installedCount: number;
}): ConnectMode {
  if (input.installedCount > 0) return 'choose';
  return input.mobile ? 'open-in-app' : 'install';
}

export interface WalletAppLink {
  id: 'phantom' | 'solflare';
  name: string;
  href: string;
}

/**
 * Browse deeplinks that open `pageUrl` inside the wallet app's own browser, where its wallet
 * is injected. Formats from each wallet's documentation: `/ul/browse/<url>?ref=<ref>` for
 * Phantom and `/ul/v1/browse/<url>?ref=<ref>` for Solflare, both URL-encoded.
 */
export function walletAppLinks(pageUrl: string): WalletAppLink[] {
  const url = new URL(pageUrl);
  // Only ever hand a wallet our own http(s) page.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return [];
  const target = encodeURIComponent(url.toString());
  const ref = encodeURIComponent(url.origin);
  return [
    {
      id: 'phantom',
      name: 'Phantom',
      href: `https://phantom.app/ul/browse/${target}?ref=${ref}`,
    },
    {
      id: 'solflare',
      name: 'Solflare',
      href: `https://solflare.com/ul/v1/browse/${target}?ref=${ref}`,
    },
  ];
}

export const WALLET_INSTALL_LINKS: readonly WalletAppLink[] = [
  { id: 'phantom', name: 'Phantom', href: 'https://phantom.com/download' },
  { id: 'solflare', name: 'Solflare', href: 'https://solflare.com/download' },
];
