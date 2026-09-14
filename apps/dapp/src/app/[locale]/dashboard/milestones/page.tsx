import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { requireAdminSession } from '@/lib/auth/require-admin-session';
import { getDemoMilestoneQueue } from '@/lib/demo/projects';
import { DashboardShell } from '@/modules/dashboard/components/dashboard-shell';
import { DemoDataPill } from '@/modules/dashboard/components/demo-data-pill';
import { MilestoneQueue } from '@/modules/dashboard/components/milestone-queue';
import { routing } from '@/lib/i18n/routing';

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
  return { title: t('milestonesPage.title') };
}

export default async function DashboardMilestonesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const session = await requireAdminSession(locale);

  const [t, tMilestones] = await Promise.all([
    getTranslations({ locale, namespace: 'admin' }),
    getTranslations({ locale, namespace: 'milestones' }),
  ]);

  const queue = getDemoMilestoneQueue();
  const statusLabels = {
    PENDING: tMilestones('status.PENDING'),
    IN_PROGRESS: tMilestones('status.IN_PROGRESS'),
    VERIFIED: tMilestones('status.VERIFIED'),
  } as const;

  return (
    <DashboardShell
      locale={locale}
      userEmail={session.user.email}
      title={t('milestonesPage.title')}
      description={t('milestonesPage.description')}
    >
      <div className="mb-6 flex justify-end">
        <DemoDataPill label={t('dashboard.demoDataNotice')} />
      </div>
      <div className="dapp-console-panel p-5 sm:p-6">
        <MilestoneQueue
          entries={queue}
          statusLabels={statusLabels}
          verifyLabel={t('dashboard.queue.verify')}
          verifyDisabledReason={t('dashboard.queue.verifyDisabledReason')}
          emptyLabel={t('dashboard.queue.empty')}
        />
      </div>
    </DashboardShell>
  );
}
