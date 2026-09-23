'use client';

import { useRef, useState } from 'react';
import * as motion from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/lib/i18n/navigation';
import BrandLogo from '@/components/helpers/brand-logo';
import ButtonLink from '@/components/ui/button-link';
import MobileMenu from '@/modules/app/components/mobile-menu';
import { LanguageSwitcher } from '@/components/helpers/language-switcher';
import ThemeSwitcher from '@/components/helpers/theme-switcher';
import { useIsScrolled } from '@/hooks/use-scroll-position';
import { cn } from '@/utils/classNames';
import { dappPoolsUrl } from '@/lib/dapp-url';

type IndicatorRect = { left: number; width: number };

const Header = () => {
  const t = useTranslations('navbar');
  const locale = useLocale();
  const navLinks = t.raw('navigation') as NavLink[];
  const isScrolled = useIsScrolled();
  const prefersReducedMotion = useReducedMotion();

  const navRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  const trackIndicator = (target: HTMLElement) => {
    const nav = navRef.current;
    if (!nav) return;
    const navBox = nav.getBoundingClientRect();
    const linkBox = target.getBoundingClientRect();
    setIndicator({ left: linkBox.left - navBox.left, width: linkBox.width });
  };

  return (
    <>
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-10000 -translate-y-24 rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform focus-visible:translate-y-0 focus-visible:outline-none"
      >
        {t('skipToContent')}
      </a>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-9999 border-b bg-background/85 backdrop-blur-md transition-colors duration-300',
          isScrolled ? 'border-border' : 'border-transparent',
        )}
      >
        <nav
          aria-label={t('logo.label')}
          className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 xl:pl-28 xl:pr-10"
        >
          <Link
            href="/#home"
            className="flex shrink-0 items-center gap-2.5 rounded-sm py-1 focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <BrandLogo alt={t('logo.alt')} size={40} className="size-7" />
            <span className="font-mono-ui text-sm font-medium tracking-[0.14em] text-foreground uppercase">
              {t('logo.label')}
            </span>
          </Link>

          <div
            ref={navRef}
            onMouseLeave={() => setIndicator(null)}
            className="relative hidden items-center lg:flex"
          >
            <motion.span
              aria-hidden
              className="bg-primary pointer-events-none absolute bottom-0 left-0 h-0.5"
              animate={{
                left: indicator?.left ?? 0,
                width: indicator?.width ?? 0,
                opacity: indicator ? 1 : 0,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 420, damping: 34 }
              }
            />
            <ul className="relative flex items-center gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onMouseEnter={(event) =>
                      trackIndicator(event.currentTarget)
                    }
                    onFocus={(event) => trackIndicator(event.currentTarget)}
                    aria-label={
                      link.description
                        ? `${link.title} — ${link.description}`
                        : undefined
                    }
                    className="font-mono-ui focus-visible:ring-ring relative z-10 block px-3 py-2 text-xs tracking-[0.1em] text-foreground/70 uppercase transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <div className="mr-1 flex items-center gap-1 border-r border-border pr-3">
              <ThemeSwitcher wrapperClassName="size-8" />
              <LanguageSwitcher />
            </div>
            <a
              href={dappPoolsUrl(locale)}
              className="focus-visible:ring-ring rounded-sm px-2 py-1 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:outline-none"
            >
              {t('cta.signIn')}
            </a>
            <ButtonLink
              href={t('cta.earlyAccess.href')}
              variant="primary"
              padding="sm"
              rounded="md"
              className="h-9 px-4 text-sm font-semibold"
            >
              {t('cta.earlyAccess.label')}
            </ButtonLink>
          </div>

          <MobileMenu />
        </nav>
      </header>
    </>
  );
};

export default Header;
