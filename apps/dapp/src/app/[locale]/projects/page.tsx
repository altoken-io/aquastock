import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicShell } from '@/components/public-shell';
import { currencyFormatter } from '@/lib/utils';
import { DEMO_PROJECTS } from '@/lib/demo/projects';
import { ProjectCard } from '@/modules/product/components/project-card';
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
  const t = await getTranslations({ locale, namespace: 'project' });
  return { title: t('allProjectsTitle') };
}

export default async function ProjectsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const tProject = await getTranslations({ locale, namespace: 'project' });

  const currency = currencyFormatter({
    locale,
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  const formatAmount = (value: number) => currency.format(value);

  return (
    <PublicShell locale={locale}>
      <section>
        <div className="container py-12 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <h1 className="text-3xl font-medium text-foreground">
              {tProject('allProjectsTitle')}
            </h1>
          </div>
          {DEMO_PROJECTS.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_PROJECTS.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  statusLabel={tProject(`status.${project.status}`)}
                  raisedLabel={tProject('raised')}
                  governmentLabel={tProject('governmentContribution')}
                  communityLabel={tProject('communityFunding')}
                  formatAmount={formatAmount}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {tProject('emptyState')}
            </p>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
