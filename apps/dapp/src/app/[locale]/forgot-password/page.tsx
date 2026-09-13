import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DappShell } from '@/components/dapp-shell';
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
    <DappShell>
      <div className="flex flex-1 items-center justify-center">
        <div className="dapp-panel flex w-full max-w-sm flex-col gap-6 px-8 py-10 sm:px-10">
          <div className="text-center">
            <h1 className="text-2xl text-foreground">
              {t('forgotPassword.title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('forgotPassword.subtitle')}
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </DappShell>
  );
}
