'use client';

import {
  ArrowLeftRight,
  CirclePause,
  ExternalLink,
  Scaling,
  ShieldAlert,
  Snowflake,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/utils/classNames';

import { usePrice } from '../hooks/use-price';
import {
  formatRelativeTime,
  isMainnet,
  shortAddress,
  toIntlLocale,
} from '../lib/format';
import { trackingGap } from '../lib/tracking';
import { useFormatters, useToken } from '../token-context';

/**
 * "What you actually own": the token is issued by a company that keeps real control over it.
 * This card says so plainly, and every claim on it is read live from the mint, never assumed.
 */
export function IssuerCard() {
  const t = useTranslations('pools.issuer');
  const token = useToken();
  const f = useFormatters();
  const issuer = token.issuer;
  const locale = toIntlLocale(useLocale());
  const { data: price } = usePrice();
  const gap = price?.reference
    ? trackingGap(price.price, price.reference.price)
    : null;

  const holder = (address: string | null) =>
    address ? (
      <a
        href={f.explorer('address', address)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
      >
        <span className="tabular-nums">{shortAddress(address)}</span>
        <ExternalLink aria-hidden className="size-3" />
      </a>
    ) : null;

  const powers: {
    key: 'pause' | 'freeze' | 'delegate' | 'multiplier';
    icon: LucideIcon;
    address?: string | null;
    body: string;
  }[] = [
    {
      key: 'pause',
      icon: CirclePause,
      address: issuer?.pauseAuthority,
      body: t('powers.pause.body'),
    },
    {
      key: 'freeze',
      icon: Snowflake,
      address: issuer?.freezeAuthority,
      body: t('powers.freeze.body'),
    },
    {
      key: 'delegate',
      icon: ArrowLeftRight,
      address: issuer?.permanentDelegate,
      body: t('powers.delegate.body'),
    },
    {
      key: 'multiplier',
      icon: Scaling,
      body: t('powers.multiplier.body', { multiplier: token.multiplier }),
    },
  ];

  return (
    <section className="dapp-console-panel p-5" aria-labelledby="issuer-title">
      <div className="flex items-start justify-between gap-3">
        <h2
          id="issuer-title"
          className="flex items-center gap-2 text-base font-semibold"
        >
          <ShieldAlert aria-hidden className="size-5 text-warning" />
          {t('title')}
        </h2>
        {issuer ? (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
              issuer.paused
                ? 'border-warning/40 bg-warning/15 text-foreground'
                : 'border-ok/30 bg-ok/10 text-ok-text',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'size-1.5 rounded-full',
                issuer.paused ? 'bg-warning' : 'bg-ok',
              )}
            />
            {issuer.paused ? t('status.paused') : t('status.live')}
          </span>
        ) : null}
      </div>

      {!issuer ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {token.ready ? t('unavailable') : t('loading')}
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            {t('intro', { symbol: token.symbol })}
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {powers.map(({ key, icon: Icon, address, body }) => (
              <li key={key} className="flex gap-3">
                <Icon
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t(`powers.${key}.title`)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
                  {address !== undefined ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {address ? (
                        <>
                          {t('authority')} {holder(address)}
                        </>
                      ) : (
                        t('noAuthority')
                      )}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {price ? (
        // The source of every "≈ $" figure in the app, stated once where the token's facts live.
        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="text-sm font-medium text-foreground">
            {t('price.title')}
          </p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-semibold tabular-nums">
              {new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: 'USD',
              }).format(Number(price.price))}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('price.perToken')}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('price.source', {
              source: price.source,
              age: formatRelativeTime(
                new Date(price.publishTime * 1_000),
                new Date(),
                locale,
              ),
            })}
          </p>
          {price.reference && gap ? (
            // Does the token still follow its fund? The gap in words, with the fund's price.
            <div className="mt-3">
              <p className="text-sm text-foreground tabular-nums">
                {t('price.tracking.gap', {
                  direction: gap.direction,
                  percent: new Intl.NumberFormat(locale, {
                    style: 'percent',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(gap.share),
                  fund: price.reference.symbol,
                  reference: new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: 'USD',
                  }).format(Number(price.reference.price)),
                })}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('price.tracking.note', {
                  fund: price.reference.symbol,
                  age: formatRelativeTime(
                    new Date(price.reference.updatedAt * 1_000),
                    new Date(),
                    locale,
                  ),
                })}
              </p>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {isMainnet(token.network)
              ? t('price.live')
              : t('price.demo', { symbol: token.symbol })}
          </p>
        </div>
      ) : null}
      <p className="mt-5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        {t('demoNote')}
      </p>
    </section>
  );
}
