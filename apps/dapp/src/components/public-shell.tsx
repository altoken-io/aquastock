import type { ReactNode } from 'react';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import BrandLogo from '@/components/helpers/brand-logo';
import { LanguageSwitcher } from '@/components/helpers/language-switcher';
import { MobileNav } from '@/components/helpers/mobile-nav';
import { PrimaryNav, type NavItem } from '@/components/helpers/primary-nav';
import ThemeSwitcher from '@/components/helpers/theme-switcher';
import { WalletButton } from '@/modules/wallet/wallet-button';
import { Link } from '@/lib/i18n/navigation';
import { WEB_BASE_URL, WEB_HOST } from '@/lib/web-url';
import { SandboxNoticeBar } from '@/modules/product/components/sandbox-notice-bar';

/**
 * The product shell — real navigation (Pools, My match) and the wallet button. `/` is
 * the login page (see memory: dapp-home-is-login), not part of this
 * product-browsing nav, so the brand mark links to `/pools` instead — the
 * actual landing for someone browsing the product. A server component: only
 * the mobile-menu Sheet and the active-state desktop nav need to be client
 * leaves (see PrimaryNav/MobileNav).
 */
export async function PublicShell({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'navbar' });
  const tLegal = await getTranslations({ locale, namespace: 'legal' });
  const navLinks = t.raw('navigation') as NavItem[];

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
      <SandboxNoticeBar />
      <header className="sticky top-0 z-40 border-b border-border/85 bg-background/85 backdrop-blur-md">
        <div className="container flex items-center justify-between gap-3 py-3.5">
          <Link href="/pools" className="flex min-w-0 items-center gap-2.5">
            <BrandLogo alt={t('logo.alt')} size={30} className="size-7" />
            <span className="hidden truncate text-sm font-semibold tracking-[0.14em] text-foreground uppercase md:inline">
              {t('logo.label')}
            </span>
          </Link>

          <PrimaryNav navLinks={navLinks} />

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="hidden text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline lg:inline-flex"
            >
              {t('cta.admin')}
            </Link>
            <WalletButton compact />
            <LanguageSwitcher />
            <ThemeSwitcher />
            <MobileNav
              navLinks={navLinks}
              adminLabel={t('cta.admin')}
              menuLabel={t('mobileMenu.title')}
              openLabel={t('mobileMenu.ariaOpen')}
              closeLabel={t('mobileMenu.ariaClose')}
            />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t border-border/85">
        <div className="container flex flex-col items-center gap-3 py-8 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <p className="flex items-center gap-2">
            <BrandLogo alt={t('logo.alt')} size={16} className="size-4" />
            {t('logo.tagline')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>{tLegal('disclaimer')}</span>
            <Link
              href={WEB_BASE_URL}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {WEB_HOST}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
