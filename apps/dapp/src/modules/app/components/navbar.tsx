'use client';

import { useTranslations } from 'next-intl';

import ResponsiveNavbar from '@/modules/app/components/responsive-navbar';
import NavLink from '@/modules/miscellaneous/components/nav-link';

import BrandLogo from '@/components/helpers/brand-logo';
import {
  MotionDiv,
  MotionLink,
} from '@/components/helpers/motion/blur-lazy-motion';

const Navbar = () => {
  const t = useTranslations('navbar');

  const navLinks = t.raw('navigation') as NavLink[];

  return (
    <header className="bg-neutral-50/25 dark:bg-neutral-950/25 fixed top-0 z-50 w-full border-b border-b-emerald-700/25 backdrop-blur px-4 py-2">
      <nav className="container mx-auto flex items-center justify-between gap-2">
        <MotionLink href="/" className="flex items-center gap-2">
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
        <div className="flex items-center gap-6 max-xl:gap-4 max-lg:hidden">
          {navLinks.map((link, idx) => (
            <MotionDiv delay={0.1 * idx} key={idx}>
              <NavLink key={idx} href={link.href} dropdown={link.dropdown}>
                {link.title}
              </NavLink>
            </MotionDiv>
          ))}
          {/* {isPending ? (
            <MotionDiv
              delay={0.1 * navLinks.length + 0.1}
              className="h-6 w-24 animate-pulse rounded-lg bg-emerald-300/25 dark:bg-emerald-700/25"
            />
          ) : data?.user ? (
            <MotionDiv delay={0.1 * navLinks.length}>
              <NavLink
                href="/app"
                dropdown={{
                  categories: accountNavLinks,
                }}
              >
                {data?.user?.name ?? t('auth')}
              </NavLink>
            </MotionDiv>
          ) : (
            <MotionDiv delay={0.1 * navLinks.length + 0.1}>
              <NavLink href="/auth/login" dropdown={userDropdownLinks}>
                {t('cta.signIn')}
              </NavLink>
            </MotionDiv>
          )} */}
        </div>
        <ResponsiveNavbar />
      </nav>
    </header>
  );
};

export default Navbar;
