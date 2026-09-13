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
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          className={cn(
            'fixed top-4 right-4 z-9999 size-10 cursor-pointer rounded-lg border border-neutral-200/80 bg-white/90 p-2.5 text-neutral-800 backdrop-blur-sm lg:hidden dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100',
            className,
          )}
        >
          <AnimatePresence>
            <div className="relative flex h-full w-full flex-col items-center justify-center">
              <MotionDiv
                animate={isOpen ? { rotate: 45 } : { rotate: 0, y: -8 }}
                className="absolute h-0.5 w-full origin-center rounded-md bg-neutral-800 dark:bg-neutral-100"
              />
              <MotionDiv
                animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                className="absolute h-0.5 w-full rounded-md bg-neutral-800 dark:bg-neutral-100"
              />
              <MotionDiv
                animate={isOpen ? { rotate: -45 } : { rotate: 0, y: 8 }}
                className="absolute h-0.5 w-full origin-center rounded-md bg-neutral-800 dark:bg-neutral-100"
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
                className="fixed top-0 left-0 z-999 h-screen w-full max-w-full overflow-hidden bg-linear-to-b from-neutral-50 to-white shadow-xl backdrop-blur-sm dark:from-neutral-950 dark:to-black"
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b border-b-neutral-300/75 px-4 py-2 dark:border-b-neutral-700/75">
                    <BrandLogo
                      alt="altoken-logo"
                      className="size-15 max-sm:size-13"
                    />
                    <div className="flex flex-col">
                      <h1 className="text-2xl leading-none font-light uppercase max-sm:text-lg">
                        Altoken
                      </h1>
                      <p className="text-muted-foreground text-xs max-sm:text-[10px]">
                        Inversión Inmobiliaria, Tokenizada y Simple
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
                            className="flex items-start justify-between hover:text-primary active:text-accent"
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
                                      <h3 className="text-medium py-4 text-primary">
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
                                            className="flex flex-col items-start justify-between hover:text-primary active:text-accent"
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
                          Contact Us
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
