import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PublicShell } from '@/components/public-shell';
import { routing } from '@/lib/i18n/routing';
import { getPoolServices } from '@/lib/pools/server';
import { getDeployment, listPools } from '@/lib/pools/service';
import { unixNow } from '@/lib/pools/clock';
import { ActionLink } from '@/modules/pools/components/actions';
import { PoolCardSkeleton } from '@/modules/pools/components/pool-card';
import { PoolListView } from '@/modules/pools/components/pool-list-view';
import type { PoolStatusFilter } from '@/modules/pools/hooks/queries';
import { TokenProvider } from '@/modules/pools/token-context';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
};

const parseStatus = (value: string | undefined): PoolStatusFilter =>
  value === 'open' || value === 'ended' ? value : 'all';

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'pools.meta' });
  return { title: t('listTitle'), description: t('listDescription') };
}

/** Reads the chain on the server, but never lets a failure take the page down. */
async function PoolsData({ status }: { status: PoolStatusFilter }) {
  let list = null;
  let deployment = null;
  try {
    const deps = getPoolServices();
    [list, deployment] = await Promise.all([
      listPools(deps, { status, limit: 50 }).catch(() => null),
      getDeployment(deps).catch(() => null),
    ]);
  } catch {
    // Misconfigured or unreachable: the browser will try again and show a proper error state.
  }
  return (
    <TokenProvider initial={deployment ?? undefined}>
      <PoolListView initial={list} status={status} serverNow={unixNow()} />
    </TokenProvider>
  );
}

export default async function PoolsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const status = parseStatus((await searchParams).status);
  const t = await getTranslations({ locale, namespace: 'pools.list' });

  return (
    <PublicShell locale={locale}>
      <section>
        <div className="container py-10 sm:py-14">
          <header className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                {t('eyebrow')}
              </p>
              <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                {t('title')}
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                {t('description')}
              </p>
            </div>
            <ActionLink href="/pools/new" className="self-start sm:self-auto">
              {t('create')}
            </ActionLink>
          </header>
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <PoolCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <PoolsData status={status} />
          </Suspense>
        </div>
      </section>
    </PublicShell>
  );
}
