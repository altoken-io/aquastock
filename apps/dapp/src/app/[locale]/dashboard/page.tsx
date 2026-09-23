import { Coins, Layers, PiggyBank, Wallet } from 'lucide-react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ButtonLink from '@/components/ui/button-link';
import { requireAdminSession } from '@/lib/auth/require-admin-session';
import { isFaucetNetwork, lamportsToSol } from '@/lib/faucet/config';
import { getFaucetServices } from '@/lib/faucet/server';
import { faucetStatus } from '@/lib/faucet/service';
import { routing } from '@/lib/i18n/routing';
import { unixNow } from '@/lib/pools/clock';
import { loadConsole, summarizePools } from '@/lib/pools/console';
import { getPoolServices } from '@/lib/pools/server';
import {
  ActivityFeed,
  type ActivityRow,
} from '@/modules/dashboard/components/activity-feed';
import { DashboardShell } from '@/modules/dashboard/components/dashboard-shell';
import {
  DeploymentCard,
  type FaucetRow,
} from '@/modules/dashboard/components/deployment-card';
import { PoolsTable } from '@/modules/dashboard/components/pools-table';
import { StatTile } from '@/modules/dashboard/components/stat-tile';
import { getConsoleFormatters } from '@/modules/dashboard/lib/console-view';
import { shortAddress } from '@/modules/pools/lib/format';

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
  return { title: t('dashboard.title') };
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const session = await requireAdminSession(locale);
  const poolServices = getPoolServices();
  const faucetServices = getFaucetServices();
  const [snapshot, faucet] = await Promise.all([
    loadConsole(poolServices),
    faucetServices ? faucetStatus(faucetServices).catch(() => null) : null,
  ]);
  const now = unixNow();

  const [t, tActivity, fmt] = await Promise.all([
    getTranslations({ locale, namespace: 'admin' }),
    getTranslations({ locale, namespace: 'pools.activity' }),
    getConsoleFormatters(locale, snapshot.deployment),
  ]);

  // Only demo networks have a faucet, so mainnet shows no row at all.
  const faucetRow: FaucetRow | null = !isFaucetNetwork(poolServices.network)
    ? null
    : !faucetServices
      ? { state: 'off' }
      : !faucet
        ? { state: 'unreadable' }
        : {
            state: 'ok',
            address: faucet.address,
            balance: t('dashboard.deployment.faucetBalance', {
              tokens: fmt.amount(faucet.tokensRaw.toString()),
              symbol: fmt.symbol,
              sol: lamportsToSol(faucet.lamports),
            }),
            low: faucet.low,
          };

  const totals = summarizePools(snapshot.pools ?? [], now);
  const reservedShare =
    totals.budget > 0n
      ? Number((totals.reserved * 10_000n) / totals.budget) / 10_000
      : 0;

  const activityRows: ActivityRow[] = snapshot.activity.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    href: `/pools/${entry.pool.address}`,
    date: fmt.dateIso(entry.occurredAt),
    text: tActivity(`kinds.${entry.kind}`, {
      who: shortAddress(entry.wallet),
      amount: fmt.amount(entry.amount ?? '0'),
      match: fmt.amount(entry.matchAmount ?? '0'),
      symbol: fmt.symbol,
    }),
  }));

  return (
    <DashboardShell
      locale={locale}
      userEmail={session.user.email}
      title={t('sidebar.overview')}
      description={t('dashboard.description')}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Layers}
          label={t('dashboard.stats.pools')}
          value={String(totals.poolCount)}
          caption={t('dashboard.stats.poolsCaption', {
            open: totals.openCount,
          })}
        />
        <StatTile
          icon={Coins}
          label={t('dashboard.stats.budget')}
          value={`${fmt.amount(totals.budget)} ${fmt.symbol}`}
          caption={t('dashboard.stats.budgetCaption')}
        />
        <StatTile
          icon={PiggyBank}
          label={t('dashboard.stats.reserved')}
          value={`${fmt.amount(totals.reserved)} ${fmt.symbol}`}
          caption={t('dashboard.stats.reservedCaption', {
            percent: fmt.percent(reservedShare),
          })}
        />
        <StatTile
          icon={Wallet}
          label={t('dashboard.stats.deposits')}
          value={`${fmt.amount(totals.deposits)} ${fmt.symbol}`}
          caption={t('dashboard.stats.depositsCaption', {
            claimed: fmt.amount(totals.claimed),
            symbol: fmt.symbol,
          })}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="dapp-console-panel p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">
                {t('dashboard.poolsTable.title')}
              </h2>
              <ButtonLink href="/dashboard/pools" variant="link">
                {t('dashboard.poolsTable.viewAll')}
              </ButtonLink>
            </div>
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
                pools={snapshot.pools.slice(0, 6)}
                now={now}
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
          </section>

          <section className="dapp-console-panel p-5 sm:p-6">
            <h2 className="mb-2 text-base font-semibold">
              {t('dashboard.deployment.title')}
            </h2>
            <DeploymentCard
              deployment={snapshot.deployment}
              labels={{
                network: t('dashboard.deployment.network'),
                program: t('dashboard.deployment.program'),
                upgradeAuthority: t('dashboard.deployment.upgradeAuthority'),
                upgradeNone: t('dashboard.deployment.upgradeNone'),
                token: t('dashboard.deployment.token'),
                transfers: t('dashboard.deployment.transfers'),
                live: t('dashboard.deployment.live'),
                paused: t('dashboard.deployment.paused'),
                multiplier: t('dashboard.deployment.multiplier'),
                pauseAuthority: t('dashboard.deployment.pauseAuthority'),
                freezeAuthority: t('dashboard.deployment.freezeAuthority'),
                permanentDelegate: t('dashboard.deployment.permanentDelegate'),
                none: t('dashboard.deployment.none'),
                notInitialized: t('dashboard.deployment.notInitialized'),
                unavailable: t('dashboard.deployment.unavailable'),
                faucet: t('dashboard.deployment.faucet'),
                faucetOff: t('dashboard.deployment.faucetOff'),
                faucetLow: t('dashboard.deployment.faucetLow'),
                faucetUnreadable: t('dashboard.deployment.faucetUnreadable'),
              }}
              explorer={fmt.explorer}
              faucet={faucetRow}
            />
          </section>
        </div>

        <section className="dapp-console-panel h-fit p-5 sm:p-6">
          <h2 className="mb-4 text-base font-semibold">
            {t('dashboard.activity.title')}
          </h2>
          <ActivityFeed
            entries={activityRows}
            emptyLabel={t('dashboard.activity.empty')}
          />
        </section>
      </div>
    </DashboardShell>
  );
}
