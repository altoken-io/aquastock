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
  'font-mono-ui text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase';

const Footer = async () => {
  const currentYear = new Date().getFullYear();
  const t = await getTranslations('footer');

  return (
    <footer className="relative flex min-h-0 w-full flex-col overflow-hidden border-t border-border bg-muted/25">
      <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-10 px-6 py-16 sm:px-8 lg:px-10 xl:pl-28 xl:pr-16">
        <div className="flex flex-col items-start gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-sm transition-opacity hover:opacity-80"
          >
            <BrandLogo alt="AquaStock" size={40} className="size-8" />
            <span className="font-mono-ui text-sm font-medium tracking-[0.14em] text-foreground uppercase">
              AquaStock
            </span>
          </Link>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t('tagline')}
          </p>
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

        <div className="font-mono-ui flex flex-col gap-2 border-t border-dashed border-border pt-6 text-[11px] tracking-[0.04em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{t('legal.copyright', { year: currentYear })}</span>
          <span>{t('legal.disclaimer')}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
