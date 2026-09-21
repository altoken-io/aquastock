'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { ActionButton, ActionLink } from '@/modules/pools/components/actions';

/**
 * The last line of defence for a page that threw while rendering. It says nothing was changed
 * (every write is a wallet-signed transaction, so a render error cannot move funds), offers a
 * retry, and shows the error digest so a report can be matched to a server log.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl font-semibold text-balance">
        {t('title')}
      </h1>
      <p className="text-base text-muted-foreground">{t('description')}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <ActionButton onClick={reset}>{t('retry')}</ActionButton>
        <ActionLink href="/pools" variant="secondary">
          {t('home')}
        </ActionLink>
      </div>
      {error.digest ? (
        <p className="text-xs text-muted-foreground tabular-nums">
          {t('reference', { digest: error.digest })}
        </p>
      ) : null}
    </main>
  );
}
