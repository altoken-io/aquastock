import { ArrowRight } from 'lucide-react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicShell } from '@/components/public-shell';
import ButtonLink from '@/components/ui/button-link';
import { currencyFormatter } from '@/lib/utils';
import { getDemoTotals, getFeaturedDemoProjects } from '@/lib/demo/projects';
import { ConfluenceRing } from '@/modules/product/components/confluence-ring';
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
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('title') };
}

const HOW_IT_WORKS_STEPS = ['browse', 'fund', 'track'] as const;

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [t, tHero, tConfluence, tProject] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    getTranslations({ locale, namespace: 'hero' }),
    getTranslations({ locale, namespace: 'confluence' }),
    getTranslations({ locale, namespace: 'project' }),
  ]);

  const totals = getDemoTotals();
  const featuredProjects = getFeaturedDemoProjects(3);
  const currency = currencyFormatter({
    locale,
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  const formatAmount = (value: number) => currency.format(value);

  return (
    <PublicShell locale={locale}>
      {/* Hero — the product's thesis: two capital sources, one funding table. */}
      <section className="border-b border-border/85">
        <div className="container grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span
                className="size-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              {tHero('usersCount')}
            </span>
            <h1 className="text-4xl font-medium text-balance text-foreground sm:text-5xl">
              {tHero('title')}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {tHero('subtitle')}
            </p>
            <p className="max-w-xl text-sm text-muted-foreground/85">
              {tHero('description')}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ButtonLink href="/projects" variant="solid" padding="lg">
                {t('hero.cta.browseProjects')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/impact" variant="transparent" padding="lg">
                {t('hero.cta.viewImpact')}
              </ButtonLink>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 justify-self-center">
            <ConfluenceRing
              publicValue={totals.totalPublic}
              privateValue={totals.totalPrivate}
              size={220}
              strokeWidth={18}
              coreValue={formatAmount(totals.totalRaised)}
              coreLabel={tProject('raised')}
            />
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full bg-public"
                  aria-hidden="true"
                />
                {tProject('governmentContribution')}
              </span>
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full bg-private"
                  aria-hidden="true"
                />
                {tProject('communityFunding')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* The Confluence — the brand's signature framing, given the dApp's own visual (see ConfluenceRing). */}
      <section className="border-b border-border/85 bg-muted/30">
        <div className="container flex flex-col items-center gap-3 py-14 text-center sm:py-20">
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {tConfluence('eyebrow')}
          </p>
          <h2 className="max-w-2xl text-3xl font-medium text-balance text-foreground">
            {tConfluence('title')}
          </h2>
          <p className="max-w-xl text-muted-foreground">
            {tConfluence('subtitle')}
          </p>
        </div>
      </section>

      {/* How it works — a real sequence, so the numbering carries information. */}
      <section className="border-b border-border/85">
        <div className="container py-14 sm:py-20">
          <h2 className="mb-10 text-center text-2xl font-medium text-foreground">
            {t('howItWorks.title')}
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <li key={step} className="dapp-panel flex flex-col gap-3 p-6">
                <span className="dapp-icon-accent text-sm font-semibold tabular-nums">
                  {index + 1}
                </span>
                <h3 className="text-base font-medium text-foreground">
                  {t(`howItWorks.steps.${step}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`howItWorks.steps.${step}.description`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured projects — real (demo) content, not a chart to interpret. */}
      <section>
        <div className="container py-14 sm:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-medium text-foreground">
              {t('featured.title')}
            </h2>
            <ButtonLink href="/projects" variant="linkText">
              {t('featured.viewAll')}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </ButtonLink>
          </div>
          {featuredProjects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
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
              {t('featured.empty')}
            </p>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
