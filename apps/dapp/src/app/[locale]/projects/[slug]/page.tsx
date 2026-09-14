import { ArrowLeft, MapPin, Wallet } from 'lucide-react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Tooltip } from '@aquastock/ui/tw/tooltip';
import { PublicShell } from '@/components/public-shell';
import ButtonLink from '@/components/ui/button-link';
import { currencyFormatter, dateFormatter } from '@/lib/utils';
import { getDemoProjectBySlug, getDemoProjectSplit } from '@/lib/demo/projects';
import { getDemoImpactForProject } from '@/lib/demo/impact';
import { ConfluenceRing } from '@/modules/product/components/confluence-ring';
import { ExplorerLink } from '@/modules/product/components/explorer-link';
import { FundingSplitBar } from '@/modules/product/components/funding-split-bar';
import { InvestorTypeBadge } from '@/modules/product/components/investor-type-badge';
import { MilestoneTimeline } from '@/modules/product/components/milestone-timeline';
import { ProjectImagePlaceholder } from '@/modules/product/components/project-image-placeholder';
import { routing } from '@/lib/i18n/routing';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  const project = getDemoProjectBySlug(slug);
  return { title: project?.name };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const project = getDemoProjectBySlug(slug);
  if (!project) {
    notFound();
  }

  const [tProject, tMilestones, tImpact] = await Promise.all([
    getTranslations({ locale, namespace: 'project' }),
    getTranslations({ locale, namespace: 'milestones' }),
    getTranslations({ locale, namespace: 'impact' }),
  ]);

  const split = getDemoProjectSplit(project);
  const impactEntries = getDemoImpactForProject(project.id);
  const currency = currencyFormatter({
    locale,
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  const formatAmount = (value: number) => currency.format(value);
  const dateFmt = dateFormatter({ locale });
  const formatVerifiedOn = (verifiedAtIso: string) =>
    tMilestones('verifiedOn', {
      date: dateFmt.format(new Date(verifiedAtIso)),
    });

  const statusLabels = {
    PENDING: tMilestones('status.PENDING'),
    IN_PROGRESS: tMilestones('status.IN_PROGRESS'),
    VERIFIED: tMilestones('status.VERIFIED'),
  } as const;

  const percentFunded =
    split.goalAmount > 0
      ? Math.round((split.raisedAmount / split.goalAmount) * 100)
      : 0;

  return (
    <PublicShell locale={locale}>
      <section className="container py-8 sm:py-12">
        <ButtonLink
          href="/projects"
          variant="linkText"
          className="mb-6 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {tProject('backToProjects')}
        </ButtonLink>

        <ProjectImagePlaceholder
          seed={project.slug}
          ratio="hero"
          className="mb-8"
        />

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex min-w-0 flex-col gap-8">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {tProject(`status.${project.status}`)}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  {project.location}
                </span>
              </div>
              <h1 className="text-3xl font-medium text-balance text-foreground">
                {project.name}
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                {project.description}
              </p>
            </div>

            <div className="dapp-panel p-6">
              <h2 className="mb-5 text-lg font-medium text-foreground">
                {tMilestones('title')}
              </h2>
              <MilestoneTimeline
                milestones={project.milestones}
                statusLabels={statusLabels}
                formatVerifiedOn={formatVerifiedOn}
              />
            </div>

            {impactEntries.length > 0 && (
              <div className="dapp-panel p-6">
                <h2 className="mb-4 text-lg font-medium text-foreground">
                  {tImpact('title')}
                </h2>
                <ul className="flex flex-col gap-3">
                  {impactEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-foreground">
                          {tImpact(`metrics.${entry.metric}`)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tImpact('recordedOn', {
                            date: dateFmt.format(new Date(entry.recordedAt)),
                          })}
                        </p>
                      </div>
                      <span className="font-display font-medium tabular-nums text-foreground">
                        {Number(entry.value).toLocaleString(locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <div className="dapp-panel-accent p-6">
              <div className="mb-5 flex justify-center">
                <ConfluenceRing
                  publicValue={split.publicAmount}
                  privateValue={split.privateAmount}
                  size={144}
                  strokeWidth={12}
                  coreValue={`${percentFunded}%`}
                  coreLabel={tProject('raised')}
                />
              </div>
              <FundingSplitBar
                goalAmount={split.goalAmount}
                publicAmount={split.publicAmount}
                privateAmount={split.privateAmount}
                raisedLabel={tProject('raised')}
                governmentLabel={tProject('governmentContribution')}
                communityLabel={tProject('communityFunding')}
                formatAmount={formatAmount}
              />

              <Tooltip content={tProject('fundCtaSoon')}>
                <span
                  className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-border/70 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-muted-foreground"
                  aria-disabled="true"
                >
                  <Wallet className="size-4" aria-hidden="true" />
                  {tProject('fundCta')}
                </span>
              </Tooltip>
            </div>

            <div className="dapp-panel p-6">
              <h2 className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {tProject('governmentContribution')} /{' '}
                {tProject('communityFunding')}
              </h2>
              <ul className="flex flex-col gap-3">
                {project.positions.map((position) => (
                  <li
                    key={position.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <InvestorTypeBadge
                      investorType={position.investorType}
                      label={tProject(`investorType.${position.investorType}`)}
                    />
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {formatAmount(Number(position.amount))}
                    </span>
                  </li>
                ))}
              </ul>
              {project.positions.some((p) => p.txSignature) && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
                  {project.positions.map(
                    (position) =>
                      position.txSignature && (
                        <ExplorerLink
                          key={position.id}
                          label={tProject('explorer')}
                          demoTitle={tProject('explorerDemo')}
                        />
                      ),
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </PublicShell>
  );
}
