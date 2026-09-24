import enPools from '@aquastock/locales/en/pools.json';
import esPools from '@aquastock/locales/es/pools.json';
import type { PriceDto } from '@aquastock/types';
import { NextIntlClientProvider } from 'next-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({ price: undefined as PriceDto | undefined }));

vi.mock('../hooks/use-price', () => ({
  usePrice: () => ({ data: holder.price }),
}));
vi.mock('../token-context', () => ({
  useToken: () => ({
    symbol: 'dSPYx',
    multiplier: '1.005714560286254',
    network: 'devnet',
    ready: true,
    issuer: {
      paused: false,
      pauseAuthority: 'PauseAuthority1111111111111111111111111111',
      freezeAuthority: 'FreezeAuthority111111111111111111111111111',
      permanentDelegate: 'Delegate11111111111111111111111111111111111',
    },
  }),
  useFormatters: () => ({
    explorer: (kind: string, address: string) =>
      `https://explorer.solana.com/${kind}/${address}`,
  }),
}));

import { IssuerCard } from './issuer-card';

const MESSAGES = {
  en: { pools: enPools },
  es: { pools: esPools },
} as const;

const now = () => Math.floor(Date.now() / 1000);

const jupiterPrice = (
  price: string,
  reference: PriceDto['reference'],
): PriceDto => ({
  source: 'jupiter',
  pair: 'SPYx/USD',
  feedId: 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W',
  price,
  confidence: null,
  publishTime: now(),
  reference,
});

const SPY = (price: string) => ({
  symbol: 'SPY',
  price,
  source: 'xstocks',
  updatedAt: now() - 120,
});

function render(locale: 'en' | 'es' = 'en'): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <IssuerCard />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  holder.price = undefined;
});

describe('IssuerCard price', () => {
  it('says in words how far the token sits from the fund it follows', () => {
    holder.price = jupiterPrice('765.629825', SPY('766.19'));
    const html = render();
    expect(html).toContain('$765.63');
    expect(html).toContain('0.07% below SPY ($766.19), the fund it follows');
    expect(html).toContain('SPY&#x27;s price from xStocks, updated');
    expect(html).toContain('Jupiter SPYx/USD');
  });

  it('says above, and says it in Spanish too (es-PE keeps a decimal point)', () => {
    holder.price = jupiterPrice('767.374799', SPY('765.95'));
    expect(render()).toContain('0.19% above SPY ($765.95)');
    // Intl puts a non-breaking space between "USD" and the amount.
    expect(render('es')).toMatch(
      /0\.19% por encima de SPY \(USD\s765\.95\), el fondo que sigue/,
    );
  });

  it('calls a gap that rounds to nothing level', () => {
    holder.price = jupiterPrice('766.19', SPY('766.19'));
    expect(render()).toContain('Level with SPY ($766.19)');
  });

  it('shows no comparison without a reference, and names CoinGecko when it is the source', () => {
    holder.price = { ...jupiterPrice('765.77', null), source: 'coingecko' };
    const html = render();
    expect(html).toContain('CoinGecko SPYx/USD');
    expect(html).not.toContain('the fund it follows');
  });

  it('hides the whole price block when there is no price', () => {
    const html = render();
    expect(html).not.toContain('SPYx market price');
    expect(html).toContain('What you actually own');
  });
});
