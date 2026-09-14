import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { currencyFormatter } from '@/lib/utils';
import { requireAdminSession } from '@/lib/auth/require-admin-session';
import { DEMO_PROJECTS } from '@/lib/demo/projects';
import { DashboardShell } from '@/modules/dashboard/components/dashboard-shell';
import { DemoDataPill } from '@/modules/dashboard/components/demo-data-pill';
import { ProjectsTable } from '@/modules/dashboard/components/projects-table';
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
  return { title: t('projectsPage.title') };
}

export default async function DashboardProjectsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const session = await requireAdminSession(locale);

  const [t, tProject] = await Promise.all([
    getTranslations({ locale, namespace: 'admin' }),
    getTranslations({ locale, namespace: 'project' }),
  ]);

  const currency = currencyFormatter({
    locale,
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  const formatAmount = (value: number) => currency.format(value);

  const projectStatusLabels = {
    DRAFT: tProject('status.DRAFT'),
    ACTIVE: tProject('status.ACTIVE'),
    FUNDED: tProject('status.FUNDED'),
    COMPLETED: tProject('status.COMPLETED'),
    CLOSED: tProject('status.CLOSED'),
  } as const;

  return (
    <DashboardShell
      locale={locale}
      userEmail={session.user.email}
      title={t('projectsPage.title')}
      description={t('projectsPage.description')}
    >
      <div className="mb-6 flex justify-end">
        <DemoDataPill label={t('dashboard.demoDataNotice')} />
      </div>
      <div className="dapp-console-panel p-5 sm:p-6">
        <ProjectsTable
          projects={DEMO_PROJECTS}
          columnLabels={{
            project: t('dashboard.projectsTable.columns.project'),
            status: t('dashboard.projectsTable.columns.status'),
            goal: t('dashboard.projectsTable.columns.goal'),
            raised: t('dashboard.projectsTable.columns.raised'),
          }}
          statusLabels={projectStatusLabels}
          milestonesLabel={(verified, total) =>
            t('dashboard.projectsTable.milestonesProgress', {
              verified,
              total,
            })
          }
          formatAmount={formatAmount}
        />
      </div>
    </DashboardShell>
  );
}
