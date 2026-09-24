'use client';

import { useRef, useState } from 'react';
import * as motion from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';

import { Link } from '@/lib/i18n/navigation';
import BrandLogo from '@/components/helpers/brand-logo';
import ButtonLink from '@/components/ui/button-link';
import MobileMenu from '@/modules/app/components/mobile-menu';
import { LanguageSwitcher } from '@/components/helpers/language-switcher';
import ThemeSwitcher from '@/components/helpers/theme-switcher';
import { useIsScrolled } from '@/hooks/use-scroll-position';
import { cn } from '@/utils/classNames';
import { dappPoolsUrl, dappUrl } from '@/lib/dapp-url';
import { navLinks } from '@/modules/app/utils/guards';

type IndicatorRect = { left: number; width: number };

/**
 * A floating pill rather than a full-width bar: it sits over the hero like a buoy and firms up
 * (more opaque, a shadow) once the page scrolls under it. The hover highlight glides between
 * links on a spring, so moving along the nav feels like one control rather than four.
 */
const Header = () => {
  const t = useTranslations('navbar');
  const locale = useLocale();
  const sections = navLinks(t.raw('sections'));
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
      <header className="pointer-events-none fixed inset-x-0 top-3 z-9999 px-3 sm:top-4 sm:px-6">
        <nav
          aria-label={t('logo.label')}
          className={cn(
            'pointer-events-auto mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-full border py-2 pr-2 pl-4 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ease-out-strong',
            isScrolled
              ? 'border-border bg-card/85 shadow-lg shadow-foreground/5'
              : 'border-border/60 bg-card/60',
          )}
        >
          <Link
            href="/#home"
            className="flex shrink-0 items-center gap-2 rounded-full py-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            <BrandLogo alt={t('logo.alt')} size={40} className="size-7" />
            <span className="font-headline text-lg font-medium tracking-tight text-foreground">
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
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-muted"
              animate={{
                left: indicator?.left ?? 0,
                width: indicator?.width ?? 0,
                opacity: indicator ? 1 : 0,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', duration: 0.35, bounce: 0.15 }
              }
            />
            <ul className="relative flex items-center">
              {sections.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onMouseEnter={(event) =>
                      trackIndicator(event.currentTarget)
                    }
                    onFocus={(event) => trackIndicator(event.currentTarget)}
                    className="relative z-10 block rounded-full px-4 py-2 text-sm text-foreground/70 transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden items-center gap-1.5 lg:flex">
            <ThemeSwitcher wrapperClassName="size-9" />
            <LanguageSwitcher />
            <a
              href={dappUrl(locale, '/my-match')}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground/75 transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {t('cta.myMatch')}
            </a>
            <ButtonLink
              href={dappPoolsUrl(locale)}
              variant="primary"
              rounded="full"
              padding="none"
              className="group h-10 pr-4 pl-5 text-sm font-semibold transition-transform duration-150 ease-out-strong active:scale-97"
            >
              {t('cta.openApp')}
              <ArrowRight
                aria-hidden
                className="size-3.5 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </ButtonLink>
          </div>

          <MobileMenu />
        </nav>
      </header>
    </>
  );
};

export default Header;
