import { Wallet } from 'lucide-react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Tooltip } from '@aquastock/ui/tw/tooltip';
import { PublicShell } from '@/components/public-shell';
import ButtonLink from '@/components/ui/button-link';
import { dateFormatter } from '@/lib/utils';
import { getDemoProjectBySlug } from '@/lib/demo/projects';
import { getDemoImpactForProject } from '@/lib/demo/impact';
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
  const t = await getTranslations({ locale, namespace: 'impact' });
  return { title: t('title') };
}

const TIMELINE_STEPS = ['capital', 'project', 'milestone', 'impact'] as const;

// The most complete demo project — every milestone that can produce impact
// has been verified, so it's the honest choice for "what this looks like".
const EXAMPLE_PROJECT_SLUG = 'costa-norte-desalination-pilot';

export default async function ImpactPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const [t, tProject] = await Promise.all([
    getTranslations({ locale, namespace: 'impact' }),
    getTranslations({ locale, namespace: 'project' }),
  ]);

  const exampleProject = getDemoProjectBySlug(EXAMPLE_PROJECT_SLUG);
  const impactEntries = exampleProject
    ? getDemoImpactForProject(exampleProject.id)
    : [];
  const dateFmt = dateFormatter({ locale });

  return (
    <PublicShell locale={locale}>
      <section className="container py-12 sm:py-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-medium text-foreground">{t('title')}</h1>
          <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="dapp-panel mt-8 flex flex-col items-start gap-4 p-8">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
          <Tooltip content={t('connectCtaSoon')}>
            <span
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-border/70 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-muted-foreground"
              aria-disabled="true"
            >
              <Wallet className="size-4" aria-hidden="true" />
              {t('connectCta')}
            </span>
          </Tooltip>
        </div>

        <ol className="mt-14 grid gap-6 sm:grid-cols-4">
          {TIMELINE_STEPS.map((step, index) => (
            <li key={step} className="flex flex-col gap-2">
              <span className="dapp-icon-accent text-sm font-semibold tabular-nums">
                {index + 1}
              </span>
              <p className="text-sm font-medium text-foreground">
                {t(`timeline.${step}`)}
              </p>
            </li>
          ))}
        </ol>

        {exampleProject && impactEntries.length > 0 && (
          <div className="dapp-panel-muted mt-14 p-6">
            <p className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('exampleLabel')}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-foreground">
                  {exampleProject.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {exampleProject.location}
                </p>
              </div>
              <ButtonLink
                href={`/projects/${exampleProject.slug}`}
                variant="linkText"
              >
                {tProject('viewProject')}
              </ButtonLink>
            </div>
            <ul className="mt-5 flex flex-col gap-3">
              {impactEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between border-t border-border/60 pt-3 text-sm first:border-0 first:pt-0"
                >
                  <div>
                    <p className="text-foreground">
                      {t(`metrics.${entry.metric}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('recordedOn', {
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
      </section>
    </PublicShell>
  );
}
