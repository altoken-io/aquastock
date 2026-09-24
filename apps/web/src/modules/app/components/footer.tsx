import { getLocale, getTranslations } from 'next-intl/server';

import BrandLogo from '@/components/helpers/brand-logo';
import { dappPoolsUrl } from '@/lib/dapp-url';
import { Link } from '@/lib/i18n/navigation';
import { PAGE_CONTAINER } from '@/modules/app/utils/layout';
import { cn } from '@/utils/classNames';

const linkClass =
  'rounded-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const Footer = async () => {
  const currentYear = new Date().getFullYear();
  const [t, locale] = await Promise.all([
    getTranslations('footer'),
    getLocale(),
  ]);

  const pageLinks = [
    { href: '/#how-it-works', label: t('quickLinks.howItWorks') },
    { href: '/#faq', label: t('quickLinks.faq') },
    { href: '/terms', label: t('quickLinks.terms') },
    { href: '/privacy', label: t('quickLinks.privacy') },
  ];

  return (
    <footer className="relative w-full overflow-hidden border-t border-border">
      <div className={cn(PAGE_CONTAINER, 'flex flex-col gap-10 pt-14')}>
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex w-fit items-center gap-2.5 rounded-sm transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <BrandLogo alt="AquaStock" size={40} className="size-7" />
              <span className="font-headline text-lg font-medium tracking-tight text-foreground">
                AquaStock
              </span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              {t('tagline')}
            </p>
          </div>

          <nav aria-label={t('quickLinks.title')}>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {pageLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={dappPoolsUrl(locale)}
                  className={cn(linkClass, 'text-foreground')}
                >
                  {t('quickLinks.openApp')}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{t('legal.copyright', { year: currentYear })}</span>
          <span>{t('legal.disclaimer')}</span>
        </div>
      </div>

      {/* The name, set as large as the page allows and sinking below the edge like a waterline. */}
      <p
        aria-hidden
        className="pointer-events-none mt-6 -mb-[0.16em] bg-linear-to-b from-foreground/20 to-foreground/0 bg-clip-text text-center font-headline text-wordmark font-semibold text-transparent select-none"
      >
        AquaStock
      </p>
    </footer>
  );
};

export default Footer;
