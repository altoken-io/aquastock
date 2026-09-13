'use client';

import { useRef, useState } from 'react';
import * as motion from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Link } from '@/lib/i18n/navigation';
import BrandLogo from '@/components/helpers/brand-logo';
import ButtonLink from '@/components/ui/button-link';
import MobileMenu from '@/modules/app/components/mobile-menu';
import { LanguageSwitcher } from '@/components/helpers/language-switcher';
import ThemeSwitcher from '@/components/helpers/theme-switcher';
import { useIsScrolled } from '@/hooks/use-scroll-position';
import { cn } from '@/utils/classNames';
import { DAPP_LOGIN_URL } from '@/lib/dapp-url';

type IndicatorRect = { left: number; width: number };

const Header = () => {
  const t = useTranslations('navbar');
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
        className="fixed top-4 left-4 z-10000 -translate-y-24 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform focus-visible:translate-y-0 focus-visible:outline-none"
      >
        {t('skipToContent')}
      </a>
      <header className="fixed inset-x-0 top-0 z-9999 flex justify-center px-3 pt-3">
        <nav
          aria-label={t('logo.label')}
          className={cn(
            'flex w-full max-w-6xl items-center justify-between gap-3 rounded-full border bg-background/60 px-3 py-2 backdrop-blur-md transition-[box-shadow,border-color] duration-300',
            isScrolled
              ? 'border-border shadow-[0_10px_30px_-14px_rgba(0,0,0,0.3)]'
              : 'border-border/50 shadow-none',
          )}
        >
          <Link
            href="/#home"
            className="flex shrink-0 items-center gap-2 rounded-full py-1 pr-2 focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <BrandLogo alt={t('logo.alt')} size={40} className="size-8" />
            <span className="font-headline text-lg font-extrabold tracking-tight text-foreground">
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
              className="bg-accent pointer-events-none absolute inset-y-1 rounded-full"
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
                    className="focus-visible:ring-ring relative z-10 block rounded-full px-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:outline-none xl:px-3"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <div className="mr-1 flex items-center gap-1 border-r border-border/70 pr-3">
              <ThemeSwitcher wrapperClassName="size-8" />
              <LanguageSwitcher />
            </div>
            <a
              href={DAPP_LOGIN_URL}
              className="focus-visible:ring-ring rounded-full px-2 py-1 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:outline-none"
            >
              {t('cta.signIn')}
            </a>
            <ButtonLink
              href={t('cta.earlyAccess.href')}
              variant="primary"
              padding="sm"
              className="h-9 rounded-full px-4 text-sm font-semibold"
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
