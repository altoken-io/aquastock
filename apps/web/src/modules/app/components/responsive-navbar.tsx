'use client';

import { FC, HTMLAttributes, useCallback, useState } from 'react';

import { ChevronRight, HelpCircle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';

import BrandLogo from '@/components/helpers/brand-logo';
import { LanguageSwitcher } from '@/components/helpers/language-switcher';
import { MotionDiv } from '@/components/helpers/motion/basic-lazy-motion';
import { MotionSection } from '@/components/helpers/motion/blur-lazy-motion';
import ThemeSwitcher from '@/components/helpers/theme-switcher';
import Portal from '@/components/ui/portal';

import useScrollLock from '@/hooks/use-scroll-lock';

import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';

const ResponsiveNavbar: FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
}) => {
  const t = useTranslations('navbar');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  const navLinks = t.raw('navigation') as NavLink[];

  useScrollLock(isOpen);

  return (
    <div className="relative lg:hidden">
      <Portal>
        <button
          type="button"
          onClick={handleClick}
          aria-label={
            isOpen ? t('mobileMenu.ariaClose') : t('mobileMenu.ariaOpen')
          }
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          className={cn(
            'fixed top-4 right-4 z-9999 size-10 cursor-pointer rounded-full border border-red-900/10 bg-white/85 p-2.5 backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-black/75',
            className,
          )}
        >
          <AnimatePresence>
            <div className="relative flex h-full w-full flex-col items-center justify-center">
              <MotionDiv
                animate={isOpen ? { rotate: 45 } : { rotate: 0, y: -8 }}
                className="absolute h-0.5 w-full origin-center rounded-md bg-stone-900 dark:bg-neutral-100"
              />
              <MotionDiv
                animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                className="absolute h-0.5 w-full rounded-md bg-stone-900 dark:bg-neutral-100"
              />
              <MotionDiv
                animate={isOpen ? { rotate: -45 } : { rotate: 0, y: 8 }}
                className="absolute h-0.5 w-full origin-center rounded-md bg-stone-900 dark:bg-neutral-100"
              />
            </div>
          </AnimatePresence>
        </button>
        <AnimatePresence>
          {isOpen && (
            <aside className="relative z-999">
              <MotionSection
                id="mobile-nav"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-0 left-0 z-999 h-screen w-full max-w-full overflow-hidden bg-linear-to-b from-white to-neutral-50 shadow-xl backdrop-blur-sm dark:from-neutral-950 dark:to-black"
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b border-b-red-900/10 px-4 py-3 dark:border-b-white/10">
                    <BrandLogo
                      alt={t('logo.alt')}
                      className="size-15 max-sm:size-13"
                    />
                    <div className="flex flex-col">
                      <h1 className="text-2xl leading-none font-light uppercase max-sm:text-lg">
                        {t('logo.label')}
                      </h1>
                      <p className="text-muted-foreground text-xs max-sm:text-[10px]">
                        {t('logo.tagline')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pt-4 pb-24">
                    <ul className="flex flex-col gap-6">
                      {navLinks.map((link, idx) => (
                        <li key={idx} className="flex flex-col gap-2">
                          <Link
                            href={link.href}
                            onClick={handleClick}
                            className="flex items-start justify-between hover:text-red-800 active:text-red-900 dark:hover:text-red-400 dark:active:text-red-500"
                          >
                            <div className="flex flex-col">
                              <p className="text-medium">{link.title}</p>
                              <p className="text-muted text-xs">
                                {link.description}
                              </p>
                            </div>
                            <ChevronRight className="text-muted size-6" />
                          </Link>
                          <div className="pl-4">
                            {link?.dropdown &&
                              link?.dropdown?.categories?.map(
                                (category, categoryIdx) => (
                                  <div
                                    key={categoryIdx}
                                    className="flex flex-col"
                                  >
                                    {category.title && (
                                      <h3 className="py-4 text-sm font-semibold uppercase tracking-[0.16em] text-red-800/80 dark:text-red-400/80">
                                        {category.title}
                                      </h3>
                                    )}
                                    <div className="flex flex-col gap-2">
                                      {category.links.map(
                                        (dropdownLink, linkIdx) => (
                                          <Link
                                            key={linkIdx}
                                            href={dropdownLink.href}
                                            onClick={handleClick}
                                            className="flex flex-col items-start justify-between hover:text-red-800 active:text-red-900 dark:hover:text-red-400 dark:active:text-red-500"
                                          >
                                            <p className="text-medium">
                                              {dropdownLink.title}
                                            </p>
                                            <p className="text-muted text-xs">
                                              {dropdownLink.description}
                                            </p>
                                          </Link>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex items-center justify-between gap-6">
                      <ThemeSwitcher />
                      <div className="flex items-center gap-2">
                        <HelpCircle className="size-4" />
                        <p className="text-muted-foreground font-light">
                          {t('mobileMenu.contact')}
                        </p>
                      </div>
                      <LanguageSwitcher />
                    </div>
                  </div>
                </div>
              </MotionSection>
            </aside>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
};

export default ResponsiveNavbar;
