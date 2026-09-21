'use client';

import { useTranslations } from 'next-intl';

import { ActionLink } from '@/modules/pools/components/actions';

// A client component on purpose: there is no next-intl middleware, so a server-rendered
// not-found page cannot know the locale, while the locale layout's provider always does.
export default function LocaleNotFound() {
  const t = useTranslations('errors.notFound');
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
