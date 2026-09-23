import { describe, expect, it } from 'vitest';

import { connectMode, isMobileDevice, walletAppLinks } from './connect-options';

const UA = {
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  android:
    'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  ipados:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  windows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
};

describe('isMobileDevice', () => {
  it('recognises phones', () => {
    expect(isMobileDevice(UA.iphone)).toBe(true);
    expect(isMobileDevice(UA.android)).toBe(true);
  });

  it('recognises an iPad that reports a desktop user agent, by touch', () => {
    expect(isMobileDevice(UA.ipados, 5)).toBe(true);
    expect(isMobileDevice(UA.mac, 0)).toBe(false);
  });

  it('treats desktops as desktops', () => {
    expect(isMobileDevice(UA.windows)).toBe(false);
    expect(isMobileDevice('')).toBe(false);
  });
});

describe('connectMode', () => {
  it('lists wallets whenever one is installed, even on a phone (a wallet app browser)', () => {
    expect(connectMode({ mobile: true, installedCount: 1 })).toBe('choose');
    expect(connectMode({ mobile: false, installedCount: 2 })).toBe('choose');
  });

  it('sends a phone without a wallet to a wallet app, and a desktop to an install page', () => {
    expect(connectMode({ mobile: true, installedCount: 0 })).toBe(
      'open-in-app',
    );
    expect(connectMode({ mobile: false, installedCount: 0 })).toBe('install');
  });
});

describe('walletAppLinks', () => {
  it('opens the same page, query included, in each wallet app browser', () => {
    const page = 'https://aquastock-dapp.vercel.app/en/pools/45K6?x=1';
    const [phantom, solflare] = walletAppLinks(page);
    const encoded = encodeURIComponent(page);
    const ref = encodeURIComponent('https://aquastock-dapp.vercel.app');
    expect(phantom?.href).toBe(
      `https://phantom.app/ul/browse/${encoded}?ref=${ref}`,
    );
    expect(solflare?.href).toBe(
      `https://solflare.com/ul/v1/browse/${encoded}?ref=${ref}`,
    );
  });

  it('encodes characters that would otherwise break out of the path', () => {
    const [phantom] = walletAppLinks(
      'https://a.example/en/pools?q=a b&c=d#top',
    );
    expect(phantom?.href).not.toContain(' ');
    expect(phantom?.href.split('?')).toHaveLength(2);
  });

  it('refuses anything that is not an http(s) page', () => {
    expect(walletAppLinks('javascript:alert(1)')).toEqual([]);
    expect(walletAppLinks('data:text/html,hi')).toEqual([]);
  });
});
