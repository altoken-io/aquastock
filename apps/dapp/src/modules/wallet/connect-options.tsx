'use client';

import { ArrowUpRight, Copy, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { ConnectMode, WalletAppLink } from './lib/connect-options';

export interface WalletChoice {
  name: string;
  icon: string;
  /** The Android Mobile Wallet Adapter: shown in words, not by its technical name. */
  isMobileApp: boolean;
  onSelect: () => void;
}

// One row shape for every choice, so a wallet, an app link and an install link read as the
// same kind of thing. 56px tall: a comfortable thumb target on a phone.
const rowClasses =
  'flex min-h-14 w-full items-center gap-3 rounded-lg border border-border/70 bg-background px-3.5 py-2.5 text-left text-sm outline-none transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring';

const sectionLabel =
  'mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase';

function LinkRow({
  href,
  title,
  hint,
  newTab,
}: {
  href: string;
  title: string;
  hint?: string;
  /** Wallet app links stay in the same tab: that is how a phone reliably hands off to the app. */
  newTab: boolean;
}) {
  return (
    <a
      href={href}
      className={rowClasses}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{title}</span>
        {hint ? (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      <ArrowUpRight
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground"
      />
    </a>
  );
}

/**
 * The body of the connect dialog: pick a wallet here, open this page inside a wallet app on a
 * phone, or install one on a desktop. On devnet it also says so, since a wallet left on mainnet
 * is the most common reason a demo transaction fails.
 */
export function ConnectOptions({
  mode,
  wallets,
  appLinks,
  installLinks,
  network,
  onCopyLink,
}: {
  mode: ConnectMode;
  wallets: readonly WalletChoice[];
  appLinks: readonly WalletAppLink[];
  installLinks: readonly WalletAppLink[];
  network: string;
  onCopyLink: () => void;
}) {
  const t = useTranslations('wallet.dialog');
  const mobileApp = wallets.find((w) => w.isMobileApp);

  const walletRow = (wallet: WalletChoice) => (
    <li key={wallet.name}>
      <button type="button" className={rowClasses} onClick={wallet.onSelect}>
        {wallet.isMobileApp ? (
          <Smartphone aria-hidden className="size-5 shrink-0 text-primary" />
        ) : (
          <img src={wallet.icon} alt="" className="size-6 shrink-0 rounded" />
        )}
        <span className="font-medium text-foreground">
          {wallet.isMobileApp ? t('mobileApp') : wallet.name}
        </span>
      </button>
    </li>
  );

  return (
    <div className="mt-4 flex flex-col gap-4">
      {mode === 'choose' ? (
        <div>
          <p className={sectionLabel}>{t('detected')}</p>
          <ul className="flex flex-col gap-2">{wallets.map(walletRow)}</ul>
        </div>
      ) : null}

      {mode === 'open-in-app' ? (
        <div>
          <p className="text-sm font-medium text-foreground">
            {t('openInApp.title')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('openInApp.body')}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {appLinks.map((link) => (
              <li key={link.id}>
                <LinkRow
                  href={link.href}
                  title={link.name}
                  hint={t('openInApp.row', { name: link.name })}
                  newTab={false}
                />
              </li>
            ))}
            {/* Android only: a wallet app on this phone, reached without leaving the browser. */}
            {mobileApp ? walletRow(mobileApp) : null}
          </ul>
          <div className="mt-3 flex flex-col items-start gap-0.5 border-t border-border/60 pt-3">
            <button
              type="button"
              onClick={onCopyLink}
              className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-primary outline-none underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Copy aria-hidden className="size-4" />
              {t('openInApp.copy')}
            </button>
            <p className="text-xs text-muted-foreground">
              {t('openInApp.copyHint')}
            </p>
          </div>
        </div>
      ) : null}

      {mode === 'install' ? (
        <div>
          <p className="text-sm font-medium text-foreground">
            {t('noWallets')}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {installLinks.map((link) => (
              <li key={link.id}>
                <LinkRow
                  href={link.href}
                  title={t('installRow', { name: link.name })}
                  newTab
                />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('installHint')}
          </p>
        </div>
      ) : null}

      {network === 'devnet' ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground">
          <span className="mt-px shrink-0 rounded-sm border border-primary/40 px-1.5 py-px font-medium text-primary">
            {t('devnet.label')}
          </span>
          <p>{t('devnet.body')}</p>
        </div>
      ) : null}
    </div>
  );
}
