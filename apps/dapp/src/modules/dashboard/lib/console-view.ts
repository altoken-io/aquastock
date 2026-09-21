import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import type { DeploymentDto, PoolDto } from '@aquastock/types';

import { env } from '@/lib/env/client';
import { shortPoolId } from '@/lib/pools/naming';
import {
  explorerUrl,
  formatTokens,
  toIntlLocale,
  type ExplorerKind,
} from '@/modules/pools/lib/format';

const RPC_URL =
  env('NEXT_PUBLIC_SOLANA_RPC_URL', true) ?? 'http://127.0.0.1:8899';

/**
 * Formatters shared by the console pages, bound to the token and language: raw amounts as a
 * wallet would show them, dates, pool names and explorer links. Server-side only.
 */
export async function getConsoleFormatters(
  locale: Locale,
  deployment: DeploymentDto | null,
) {
  const intl = toIntlLocale(locale);
  const issuer = deployment?.issuer ?? null;
  const decimals = issuer?.decimals ?? 8;
  const multiplier = issuer?.multiplier ?? '1';
  const network = deployment?.network ?? 'localnet';
  const tDetail = await getTranslations({ locale, namespace: 'pools.detail' });
  const date = new Intl.DateTimeFormat(intl, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const dateOnly = new Intl.DateTimeFormat(intl, { dateStyle: 'medium' });
  const percent = new Intl.NumberFormat(intl, {
    style: 'percent',
    maximumFractionDigits: 0,
  });

  return {
    intl,
    symbol: issuer?.symbol ?? 'SPYx',
    amount: (raw: string | bigint): string =>
      formatTokens(BigInt(raw), decimals, multiplier, intl),
    date: (unixSeconds: number): string => date.format(unixSeconds * 1_000),
    /** Date without the time of day, for tables where width is tight. */
    dateShort: (unixSeconds: number): string =>
      dateOnly.format(unixSeconds * 1_000),
    dateIso: (iso: string): string => date.format(new Date(iso)),
    percent: (fraction: number): string => percent.format(fraction),
    poolName: (pool: Pick<PoolDto, 'metadata' | 'poolId'>): string =>
      pool.metadata?.name ??
      tDetail('unnamed', { id: shortPoolId(pool.poolId) }),
    explorer: (kind: ExplorerKind, id: string): string =>
      explorerUrl(network, kind, id, RPC_URL),
  };
}
