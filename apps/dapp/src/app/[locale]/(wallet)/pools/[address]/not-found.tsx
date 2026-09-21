'use client';

import { useTranslations } from 'next-intl';

import { ActionLink } from '@/modules/pools/components/actions';

// Client component for the same reason as the locale-level not-found: the locale comes from the
// layout's provider, not from request state.
export default function PoolNotFound() {
  const t = useTranslations('errors.poolNotFound');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl font-semibold text-balance">
        {t('title')}
      </h1>
      <p className="text-base text-muted-foreground">{t('description')}</p>
      <ActionLink href="/pools" className="mt-2">
        {t('cta')}
      </ActionLink>
    </main>
  );
}
