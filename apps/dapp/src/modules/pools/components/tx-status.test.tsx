import enTx from '@aquastock/locales/en/tx.json';
import esTx from '@aquastock/locales/es/tx.json';
import { NextIntlClientProvider } from 'next-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// `ActionButton` shares a file with `ActionLink`, which needs next-intl's router; not needed here.
vi.mock('@/lib/i18n/navigation', () => ({ Link: 'a' }));

import { PROGRAM_ERROR_CODES, isProgramErrorCode } from '../lib/tx-errors';
import type { TxState } from '../tx/use-pool-transaction';
import { TxStatus } from './tx-status';

const MESSAGES = { en: { tx: enTx }, es: { tx: esTx } } as const;

function render(state: TxState, locale: 'en' | 'es' = 'en'): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <TxStatus state={state} onDismiss={vi.fn()} />
    </NextIntlClientProvider>,
  );
}

describe('TxStatus', () => {
  it('renders nothing but an empty live region while idle', () => {
    const html = render({ phase: 'idle' });
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('Confirm');
  });

  it('asks the person to approve, and says nothing has been sent yet', () => {
    const html = render({ phase: 'signing', action: 'deposit' });
    expect(html).toContain('Approve in your wallet');
    expect(html).toContain('Nothing has been sent yet');
  });

  it('links to the transaction once it is sent, before it is confirmed', () => {
    const html = render({
      phase: 'confirming',
      action: 'claim',
      signature: 'SIG123',
    });
    expect(html).toContain('Confirming on Solana');
    expect(html).toContain('View transaction');
    expect(html).toContain('SIG123');
  });

  it('says what happened per action once done', () => {
    expect(
      render({ phase: 'done', action: 'withdraw', signature: 'S' }),
    ).toContain('Your deposit is back in your wallet');
    expect(render({ phase: 'done', action: 'fund', signature: 'S' })).toContain(
      'Match budget added',
    );
  });

  it('names a program error in plain words and interrupts a screen reader', () => {
    const html = render({
      phase: 'error',
      action: 'deposit',
      error: { kind: 'program', code: 'DepositExceedsCap' },
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain('That didn&#x27;t go through');
    expect(html).toContain('more than this pool allows per saver');
  });

  it('explains a cancelled wallet request as harmless', () => {
    const html = render({
      phase: 'error',
      action: 'claim',
      error: { kind: 'wallet-rejected' },
    });
    expect(html).toContain(
      'You cancelled the request in your wallet. Nothing was sent.',
    );
  });

  it('has a message for every error kind and program code in both languages', () => {
    const kinds = [
      'wallet-rejected',
      'wallet-not-connected',
      'insufficient-sol',
      'expired',
      'network',
      'unknown',
    ] as const;
    for (const locale of ['en', 'es'] as const) {
      for (const kind of kinds) {
        const html = render(
          { phase: 'error', action: 'deposit', error: { kind } },
          locale,
        );
        expect(html, `${locale} ${kind}`).not.toContain('errors.kinds');
      }
    }
    // Every program error renders real copy, never a raw message key.
    for (const locale of ['en', 'es'] as const) {
      for (const code of PROGRAM_ERROR_CODES) {
        if (!isProgramErrorCode(code))
          throw new Error(`not a program error: ${code}`);
        const html = render(
          {
            phase: 'error',
            action: 'deposit',
            error: { kind: 'program', code },
          },
          locale,
        );
        expect(html, `${locale} ${code}`).not.toContain('errors.program');
      }
    }
  });
});
