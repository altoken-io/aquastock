'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ArrowUpRight, Menu, X } from 'lucide-react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as motion from 'motion/react-m';
import { useLocale, useTranslations } from 'next-intl';

import { dappPoolsUrl, dappUrl } from '@/lib/dapp-url';
import { navLinks } from '@/modules/app/utils/guards';

import BrandLogo from '@/components/helpers/brand-logo';
import ButtonLink from '@/components/ui/button-link';
import Portal from '@/components/ui/portal';
import { LanguageSwitcher } from '@/components/helpers/language-switcher';
import ThemeSwitcher from '@/components/helpers/theme-switcher';

import { useScrollLock } from '@/hooks/use-scroll-lock';

import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';

const PANEL_ID = 'mobile-menu-panel';

const MobileMenu = ({ className }: { className?: string }) => {
  const t = useTranslations('navbar');
  const locale = useLocale();
  const sections = navLinks(t.raw('sections'));
  const appLinks = navLinks(t.raw('navigation'));
  const prefersReducedMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasOpenedRef = useRef(false);

  useScrollLock(isOpen);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  // Move focus into the panel once it mounts.
  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  // Remove the rest of the page from the tab order and from assistive tech
  // while the full-screen panel is open — it visually covers everything else,
  // so nothing behind it should be reachable either. Focus is restored to the
  // trigger here (rather than in handleClose) so it happens only after inert
  // is lifted from its ancestors — otherwise the browser can't focus it and
  // silently drops focus to <body>.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const siblings = Array.from(document.body.children).filter(
      (el) => el.id !== PANEL_ID,
    );
    if (isOpen) {
      hasOpenedRef.current = true;
      siblings.forEach((el) => el.setAttribute('inert', ''));
    } else {
      siblings.forEach((el) => el.removeAttribute('inert'));
      if (hasOpenedRef.current) triggerRef.current?.focus();
    }
    return () => {
      siblings.forEach((el) => el.removeAttribute('inert'));
    };
  }, [isOpen]);

  return (
    <div className={cn('lg:hidden', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        aria-label={t('mobileMenu.ariaOpen')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        className="flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-150 ease-out-strong active:scale-95"
      >
        <Menu className="size-4.5" />
      </button>

      <Portal>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id={PANEL_ID}
              role="dialog"
              aria-modal="true"
              aria-label={t('mobileMenu.ariaOpen')}
              initial={
                prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16 }
              }
              transition={{
                duration: prefersReducedMotion ? 0 : 0.32,
                ease: [0.19, 1, 0.22, 1],
              }}
              className="fixed inset-0 z-99999 flex flex-col overflow-hidden bg-background lg:hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                <Link
                  href="/#home"
                  onClick={handleClose}
                  className="flex items-center gap-2.5 rounded-sm py-1"
                >
                  <BrandLogo alt={t('logo.alt')} size={40} className="size-7" />
                  <span className="font-headline text-lg font-medium tracking-tight text-foreground">
                    {t('logo.label')}
                  </span>
                </Link>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={handleClose}
                  aria-label={t('mobileMenu.ariaClose')}
                  className="flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-150 ease-out-strong active:scale-95"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              <nav
                aria-label={t('logo.label')}
                className="flex-1 overflow-y-auto px-4 sm:px-6"
              >
                <ul>
                  {sections.map((link) => (
                    <li key={link.href} className="border-b border-border/70">
                      <Link
                        href={link.href}
                        onClick={handleClose}
                        className="block py-5 font-headline text-3xl leading-none font-medium tracking-tight text-foreground transition-colors hover:text-primary"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                  {/* Product pages live in the dApp, not on this site. */}
                  {appLinks.map((link) => (
                    <li
                      key={link.href}
                      className="border-b border-border/70 last:border-b-0"
                    >
                      <a
                        href={dappUrl(locale, link.href)}
                        onClick={handleClose}
                        className="group flex items-baseline justify-between gap-4 py-5"
                      >
                        <span className="flex flex-col gap-1">
                          <span className="font-headline text-3xl leading-none font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">
                            {link.title}
                          </span>
                          {link.description && (
                            <span className="font-body text-sm text-muted-foreground">
                              {link.description}
                            </span>
                          )}
                        </span>
                        <ArrowUpRight className="size-5 shrink-0 text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-background px-4 py-4 sm:px-6">
                <ThemeSwitcher wrapperClassName="size-10" />
                <LanguageSwitcher />
              </div>
              <div className="border-t border-border/70 bg-background px-4 py-4 sm:px-6">
                <ButtonLink
                  href={dappPoolsUrl(locale)}
                  onClick={handleClose}
                  variant="primary"
                  width="full"
                  rounded="full"
                  className="h-12 text-sm font-semibold transition-transform duration-150 ease-out-strong active:scale-97"
                >
                  {t('cta.openApp')}
                </ButtonLink>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
};

export default MobileMenu;
