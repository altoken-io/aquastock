import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PublicShell } from '@/components/public-shell';
import { ApiError } from '@/lib/api/errors';
import { routing } from '@/lib/i18n/routing';
import { getPoolServices } from '@/lib/pools/server';
import { getDeployment, getPoolDetail } from '@/lib/pools/service';
import { isValidAddress } from '@/lib/pools/schemas';
import { unixNow } from '@/lib/pools/clock';
import { shortPoolId } from '@/lib/pools/naming';
import {
  DetailSkeleton,
  PoolDetailView,
} from '@/modules/pools/components/pool-detail-view';
import { TokenProvider } from '@/modules/pools/token-context';

type PageProps = { params: Promise<{ locale: string; address: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale, address } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  // So a not-found page rendered from here speaks the visitor's language.
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pools' });
  // Metadata resolves before the page streams, so this is the last moment a missing pool can
  // still answer with a real 404 status.
  if (!isValidAddress(address)) notFound();
  try {
    const detail = await getPoolDetail(getPoolServices(), address, undefined);
    return {
      title:
        detail.pool.metadata?.name ??
        t('detail.unnamed', { id: shortPoolId(detail.pool.poolId) }),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    // The chain is unreachable: the page still renders and the browser retries.
    return { title: t('meta.notFoundTitle') };
  }
}

async function PoolData({ address }: { address: string }) {
  let detail = null;
  let deployment = null;
  try {
    const deps = getPoolServices();
    [detail, deployment] = await Promise.all([
      getPoolDetail(deps, address, undefined),
      getDeployment(deps).catch(() => null),
    ]);
  } catch (error) {
    // A missing pool is a real 404; anything else (RPC down) lets the browser retry.
    if (error instanceof ApiError && error.status === 404) notFound();
  }
  return (
    <TokenProvider initial={deployment ?? undefined}>
      <PoolDetailView
        address={address}
        initial={detail}
        serverNow={unixNow()}
      />
    </TokenProvider>
  );
}

export default async function PoolPage({ params }: PageProps) {
  const { locale, address } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (!isValidAddress(address)) notFound();

  return (
    <PublicShell locale={locale}>
      <section>
        <div className="container py-8 sm:py-12">
          <Suspense fallback={<DetailSkeleton />}>
            <PoolData address={address} />
          </Suspense>
        </div>
      </section>
    </PublicShell>
  );
}
