import { Activity, ClipboardCheck, Coins, FolderKanban } from 'lucide-react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ButtonLink from '@/components/ui/button-link';
import { currencyFormatter, dateFormatter } from '@/lib/utils';
import { requireAdminSession } from '@/lib/auth/require-admin-session';
import {
  DEMO_PROJECTS,
  getDemoActivityFeed,
  getDemoMilestoneQueue,
  getDemoTotals,
} from '@/lib/demo/projects';
import { DEMO_IMPACT_ENTRIES } from '@/lib/demo/impact';
import {
  ActivityFeed,
  type ActivityRow,
} from '@/modules/dashboard/components/activity-feed';
import { DashboardShell } from '@/modules/dashboard/components/dashboard-shell';
import { DemoDataPill } from '@/modules/dashboard/components/demo-data-pill';
import { MilestoneQueue } from '@/modules/dashboard/components/milestone-queue';
import { ProjectsTable } from '@/modules/dashboard/components/projects-table';
import { StatTile } from '@/modules/dashboard/components/stat-tile';
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
  return { title: t('dashboard.title') };
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const session = await requireAdminSession(locale);

  const [t, tProject, tMilestones] = await Promise.all([
    getTranslations({ locale, namespace: 'admin' }),
    getTranslations({ locale, namespace: 'project' }),
    getTranslations({ locale, namespace: 'milestones' }),
  ]);

  const totals = getDemoTotals();
  const queue = getDemoMilestoneQueue().slice(0, 5);
  const activity = getDemoActivityFeed(6);
  const currency = currencyFormatter({
    locale,
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  const formatAmount = (value: number) => currency.format(value);
  const dateFmt = dateFormatter({ locale });

  const activityRows: ActivityRow[] = activity.map((entry) =>
    entry.kind === 'position_funded'
      ? {
          id: entry.id,
          kind: entry.kind,
          href: `/projects/${entry.projectSlug}`,
          date: dateFmt.format(new Date(entry.occurredAt)),
          text: t('dashboard.activity.positionFunded', {
            investorType: tProject(`investorType.${entry.investorType}`),
            project: entry.projectName,
          }),
        }
      : {
          id: entry.id,
          kind: entry.kind,
          href: `/projects/${entry.projectSlug}`,
          date: dateFmt.format(new Date(entry.occurredAt)),
          text: t('dashboard.activity.milestoneVerified', {
            milestone: entry.milestoneTitle,
            project: entry.projectName,
          }),
        },
  );

  const statusLabels = {
    PENDING: tMilestones('status.PENDING'),
    IN_PROGRESS: tMilestones('status.IN_PROGRESS'),
    VERIFIED: tMilestones('status.VERIFIED'),
  } as const;

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
      title={t('sidebar.commandCenter')}
      description={t('dashboard.description')}
    >
      <div className="mb-6 flex justify-end">
        <DemoDataPill label={t('dashboard.demoDataNotice')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={FolderKanban}
          label={t('dashboard.stats.activeProjects')}
          value={String(totals.activeProjectCount)}
          caption={`${totals.projectCount} total`}
        />
        <StatTile
          icon={ClipboardCheck}
          label={t('dashboard.stats.milestonesPending')}
          value={String(totals.milestonesPending)}
          caption={`${totals.milestonesVerified} ${tMilestones('status.VERIFIED').toLowerCase()}`}
        />
        <StatTile
          icon={Coins}
          label={t('dashboard.stats.totalRaised')}
          value={formatAmount(totals.totalRaised)}
          caption={t('dashboard.stats.totalRaisedCaption', {
            publicAmount: formatAmount(totals.totalPublic),
            privateAmount: formatAmount(totals.totalPrivate),
          })}
        />
        <StatTile
          icon={Activity}
          label={t('dashboard.stats.impactRecords')}
          value={String(DEMO_IMPACT_ENTRIES.length)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="dapp-console-panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-medium text-foreground">
              {t('dashboard.queue.title')}
            </h2>
            <ButtonLink href="/dashboard/milestones" variant="linkText">
              {t('dashboard.queue.viewAll')}
            </ButtonLink>
          </div>
          <MilestoneQueue
            entries={queue}
            statusLabels={statusLabels}
            verifyLabel={t('dashboard.queue.verify')}
            verifyDisabledReason={t('dashboard.queue.verifyDisabledReason')}
            emptyLabel={t('dashboard.queue.empty')}
          />
        </div>

        <div className="dapp-console-panel p-5 sm:p-6">
          <h2 className="mb-4 text-base font-medium text-foreground">
            {t('dashboard.activity.title')}
          </h2>
          <ActivityFeed
            entries={activityRows}
            emptyLabel={t('dashboard.activity.empty')}
          />
        </div>
      </div>

      <div className="dapp-console-panel mt-6 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-medium text-foreground">
            {t('dashboard.projectsTable.title')}
          </h2>
          <ButtonLink href="/dashboard/projects" variant="linkText">
            {t('dashboard.projectsTable.viewAll')}
          </ButtonLink>
        </div>
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
