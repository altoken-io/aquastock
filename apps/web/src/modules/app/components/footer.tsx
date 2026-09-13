import { getTranslations } from 'next-intl/server';

import BrandLogo from '@/components/helpers/brand-logo';
import { Link } from '@/lib/i18n/navigation';

const legalLinks = [
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
] as const;

const linkClass =
  'text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xs';

const eyebrowClass =
  'text-xs font-medium tracking-widest text-muted-foreground uppercase';

const Footer = async () => {
  const currentYear = new Date().getFullYear();
  const t = await getTranslations('footer');

  return (
    <footer className="relative flex min-h-0 w-full flex-col overflow-hidden border-t border-border bg-muted/25 lg:min-h-[var(--footer-min-height)]">
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-5 py-16 sm:px-8 lg:px-10">
        <div className="flex flex-1 flex-col justify-between gap-16 lg:gap-24">
          <div className="flex flex-col items-start gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
            >
              <BrandLogo alt="AquaStock" size={40} className="size-9" />
              <span className="font-headline text-xl font-extrabold tracking-tight text-foreground">
                AquaStock
              </span>
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t('tagline')}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="hidden select-none items-end justify-between lg:flex"
          >
            <BrandLogo
              alt=""
              size={160}
              className="size-32 opacity-[0.08] xl:size-40"
            />
            <span className="font-headline text-[13vw] leading-none font-extrabold tracking-tighter text-foreground/[0.06] xl:text-[10rem]">
              AquaStock
            </span>
          </div>
        </div>

        <nav aria-label={t('quickLinks.title')} className="flex flex-col gap-4">
          <p className={eyebrowClass}>{t('quickLinks.title')}</p>
          <ul className="flex flex-col gap-3 text-sm">
            {legalLinks.map(({ href, key }) => (
              <li key={key}>
                <Link href={href} className={linkClass}>
                  {t(`quickLinks.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{t('legal.copyright', { year: currentYear })}</span>
          <span>{t('legal.disclaimer')}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
