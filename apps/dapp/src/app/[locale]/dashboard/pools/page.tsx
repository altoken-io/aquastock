import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { requireAdminSession } from '@/lib/auth/require-admin-session';
import { routing } from '@/lib/i18n/routing';
import { unixNow } from '@/lib/pools/clock';
import { loadConsole } from '@/lib/pools/console';
import { getPoolServices } from '@/lib/pools/server';
import { DashboardShell } from '@/modules/dashboard/components/dashboard-shell';
import { PoolsTable } from '@/modules/dashboard/components/pools-table';
import { getConsoleFormatters } from '@/modules/dashboard/lib/console-view';

export const dynamic = 'force-dynamic';

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
  return { title: t('poolsPage.title') };
}

export default async function DashboardPoolsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const session = await requireAdminSession(locale);
  const snapshot = await loadConsole(getPoolServices());
  const [t, fmt] = await Promise.all([
    getTranslations({ locale, namespace: 'admin' }),
    getConsoleFormatters(locale, snapshot.deployment),
  ]);

  return (
    <DashboardShell
      locale={locale}
      userEmail={session.user.email}
      title={t('poolsPage.title')}
      description={t('poolsPage.description')}
    >
      <div className="dapp-console-panel p-5 sm:p-6">
        {snapshot.pools === null ? (
          <p className="text-sm text-muted-foreground">
            {t('dashboard.poolsTable.unavailable')}
          </p>
        ) : snapshot.pools.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('dashboard.poolsTable.empty')}
          </p>
        ) : (
          <PoolsTable
            label={t('dashboard.poolsTable.title')}
            pools={snapshot.pools}
            now={unixNow()}
            columnLabels={{
              pool: t('dashboard.poolsTable.columns.pool'),
              status: t('dashboard.poolsTable.columns.status'),
              budget: t('dashboard.poolsTable.columns.budget'),
              reserved: t('dashboard.poolsTable.columns.reserved'),
              closes: t('dashboard.poolsTable.columns.closes'),
            }}
            displayName={fmt.poolName}
            formatAmount={fmt.amount}
            formatDate={fmt.dateShort}
          />
        )}
      </div>
    </DashboardShell>
  );
}
