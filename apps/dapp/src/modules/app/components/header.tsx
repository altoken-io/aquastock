'use client';

import { useTranslations } from 'next-intl';

import ResponsiveNavbar from '@/modules/app/components/responsive-navbar';

import BrandLogo from '@/components/helpers/brand-logo';
import { LanguageSwitcher } from '@/components/helpers/language-switcher';
import {
  MotionDiv,
  MotionLink,
} from '@/components/helpers/motion/blur-lazy-motion';
import ThemeSwitcher from '@/components/helpers/theme-switcher';

const Navbar = () => {
  const t = useTranslations('navbar');

  return (
    <header className="bg-white/95 dark:bg-neutral-950/95 fixed top-0 z-9999 w-full border-b border-b-emerald-300/75 dark:border-b-emerald-700/25 backdrop-blur">
      <nav className="mx-auto flex items-center justify-between gap-2 px-8 max-sm:px-4 py-2">
        <MotionLink delay={0.1} href="/" className="flex items-center gap-2">
          <BrandLogo alt="altoken-logo" className="size-15 max-sm:size-13" />
          <div className="flex flex-col">
            <h1 className="text-2xl leading-none font-light uppercase max-sm:text-lg">
              {t('logo.label')}
            </h1>
            <p className="text-muted-foreground text-xs max-sm:text-[10px]">
              {t('logo.tagline')}
            </p>
          </div>
        </MotionLink>
        <MotionDiv
          delay={0.2}
          className="flex items-center gap-4 max-lg:hidden"
        >
          <ThemeSwitcher />
          <LanguageSwitcher />
        </MotionDiv>
        <ResponsiveNavbar />
      </nav>
    </header>
  );
};

export default Navbar;
