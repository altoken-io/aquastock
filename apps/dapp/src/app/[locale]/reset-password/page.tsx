import { Suspense } from 'react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AuthShell } from '@/components/auth-shell';
import { routing } from '@/lib/i18n/routing';
import { ResetPasswordForm } from '@/modules/auth/components/reset-password-form';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: t('resetPassword.title') };
}

export default async function ResetPasswordPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });

  return (
    <AuthShell
      locale={locale}
      title={t('resetPassword.title')}
      subtitle={t('resetPassword.subtitle')}
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
