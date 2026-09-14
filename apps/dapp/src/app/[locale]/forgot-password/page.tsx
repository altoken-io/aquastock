import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AuthShell } from '@/components/auth-shell';
import { routing } from '@/lib/i18n/routing';
import { ForgotPasswordForm } from '@/modules/auth/components/forgot-password-form';

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
  return { title: t('forgotPassword.title') };
}

export default async function ForgotPasswordPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'admin' });

  return (
    <AuthShell
      locale={locale}
      title={t('forgotPassword.title')}
      subtitle={t('forgotPassword.subtitle')}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
