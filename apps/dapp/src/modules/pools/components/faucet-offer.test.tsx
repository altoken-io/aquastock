import enFaucet from '@aquastock/locales/en/faucet.json';
import esFaucet from '@aquastock/locales/es/faucet.json';
import { NextIntlClientProvider } from 'next-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// `ActionButton` shares a file with `ActionLink`, which needs next-intl's router; not needed here.
vi.mock('@/lib/i18n/navigation', () => ({ Link: 'a' }));

import {
  FaucetOffer,
  FaucetOfferView,
  type FaucetOfferState,
} from './faucet-offer';

const MESSAGES = {
  en: { faucet: enFaucet },
  es: { faucet: esFaucet },
} as const;
const INFO = { tokens: '100', sol: '0.02' };

function render(state: FaucetOfferState, locale: 'en' | 'es' = 'en'): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <FaucetOfferView
        info={INFO}
        symbol="dSPYx"
        state={state}
        onRequest={vi.fn()}
      />
    </NextIntlClientProvider>,
  );
}

describe('FaucetOfferView', () => {
  it('says what the faucet sends, and that the tokens have no value', () => {
    const html = render({ phase: 'idle' });
    expect(html).toContain('Get 100 dSPYx');
    expect(html).toContain('0.02 SOL');
    expect(html).toContain('tokens have no value');
    expect(html).not.toContain('role="alert"');
  });

  it('disables the button while sending, so a double click sends one request', () => {
    const html = render({ phase: 'sending' });
    expect(html).toContain('Sending demo tokens');
    expect(html).toMatch(/<button[^>]*disabled=""/);
    expect(html).toContain('aria-busy="true"');
  });

  it('links to the transaction once sent', () => {
    const html = render({ phase: 'sent', signature: 'SIG9' });
    expect(html).toContain('Demo tokens and SOL are in your wallet');
    expect(html).toContain('View transaction');
    expect(html).toContain('SIG9');
  });

  it.each([
    ['alreadyFunded', 'already has enough'],
    ['rateLimited', 'Try again tomorrow'],
    ['empty', 'faucet is empty'],
    ['failed', 'Try again'],
    ['generic', 'Try again in a moment'],
  ] as const)('explains %s as an alert and keeps the button', (error, text) => {
    const html = render({ phase: 'error', error });
    expect(html).toContain('role="alert"');
    expect(html).toContain(text);
    expect(html).toContain('Get 100 dSPYx');
  });

  it('speaks Spanish', () => {
    const html = render({ phase: 'idle' }, 'es');
    expect(html).toContain('Recibir 100 dSPYx');
    expect(html).toContain('no tienen valor');
  });
});

describe('FaucetOffer', () => {
  it('renders nothing without a faucet or a connected wallet', () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="en" messages={MESSAGES.en}>
        <FaucetOffer />
      </NextIntlClientProvider>,
    );
    expect(html).toBe('');
  });
});
