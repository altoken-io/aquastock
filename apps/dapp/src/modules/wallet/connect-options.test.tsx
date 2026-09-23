import enWallet from '@aquastock/locales/en/wallet.json';
import esWallet from '@aquastock/locales/es/wallet.json';
import { NextIntlClientProvider } from 'next-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ConnectOptions, type WalletChoice } from './connect-options';
import {
  WALLET_INSTALL_LINKS,
  walletAppLinks,
  type ConnectMode,
} from './lib/connect-options';

const MESSAGES = {
  en: { wallet: enWallet },
  es: { wallet: esWallet },
} as const;
const PAGE = 'https://aquastock-dapp.vercel.app/en/pools/45K6';

const phantom: WalletChoice = {
  name: 'Phantom',
  icon: 'data:image/svg+xml,',
  isMobileApp: false,
  onSelect: vi.fn(),
};
const mobileApp: WalletChoice = {
  name: 'Mobile Wallet Adapter',
  icon: 'data:image/svg+xml,',
  isMobileApp: true,
  onSelect: vi.fn(),
};

function render(
  mode: ConnectMode,
  options: {
    wallets?: WalletChoice[];
    network?: string;
    locale?: 'en' | 'es';
  } = {},
): string {
  const locale = options.locale ?? 'en';
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <ConnectOptions
        mode={mode}
        wallets={options.wallets ?? []}
        appLinks={walletAppLinks(PAGE)}
        installLinks={WALLET_INSTALL_LINKS}
        network={options.network ?? 'devnet'}
        onCopyLink={vi.fn()}
      />
    </NextIntlClientProvider>,
  );
}

describe('ConnectOptions', () => {
  it('lists the wallets found in this browser', () => {
    const html = render('choose', { wallets: [phantom] });
    expect(html).toContain('Found in this browser');
    expect(html).toContain('Phantom');
    expect(html).not.toContain('Open this page in your wallet app');
  });

  it('on a phone, opens this same page inside Phantom or Solflare, in the same tab', () => {
    const html = render('open-in-app');
    expect(html).toContain('Open this page in your wallet app');
    expect(html).toContain(
      `https://phantom.app/ul/browse/${encodeURIComponent(PAGE)}`,
    );
    expect(html).toContain(
      `https://solflare.com/ul/v1/browse/${encodeURIComponent(PAGE)}`,
    );
    expect(html).not.toMatch(/phantom\.app[^"]*"[^>]*target="_blank"/);
    expect(html).toContain('Copy this page&#x27;s link');
  });

  it('names the Android wallet-app option in words, not as "Mobile Wallet Adapter"', () => {
    const html = render('open-in-app', { wallets: [mobileApp] });
    expect(html).toContain('A wallet app on this phone');
    expect(html).not.toContain('Mobile Wallet Adapter');
  });

  it('on a desktop without a wallet, links to installs in a new tab', () => {
    const html = render('install');
    expect(html).toContain('Get Phantom');
    expect(html).toContain('Get Solflare');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('reload this page');
  });

  it('warns to switch to Devnet only on devnet', () => {
    expect(render('choose', { wallets: [phantom] })).toContain(
      'Switch your wallet to Devnet',
    );
    expect(
      render('choose', { wallets: [phantom], network: 'mainnet-beta' }),
    ).not.toContain('Devnet');
  });

  it('speaks Spanish', () => {
    const html = render('open-in-app', { locale: 'es' });
    expect(html).toContain('Abre esta página en tu app de billetera');
    expect(html).toContain('Cambia tu billetera a Devnet');
  });
});
