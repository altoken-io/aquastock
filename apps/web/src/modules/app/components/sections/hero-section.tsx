import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';

import ButtonLink from '@/components/ui/button-link';
import { dappPoolsUrl } from '@/lib/dapp-url';
import { ConfluencePlate } from '@/modules/app/components/confluence-plate';
import { PAGE_CONTAINER } from '@/modules/app/utils/layout';

export async function HeroSection() {
  const [t, locale] = await Promise.all([getTranslations('hero'), getLocale()]);

  return (
    <section id="home" className="w-full pt-32 pb-10 sm:pt-36">
      <div className={PAGE_CONTAINER}>
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="animate-rise rise-1 inline-flex items-center gap-2.5 rounded-full border border-border bg-card py-1 pr-3.5 pl-2 text-sm text-muted-foreground shadow-xs">
            <span className="flex items-center gap-1.5 rounded-full bg-ok/12 px-2 py-0.5 font-medium text-ok-text">
              <span className="relative flex size-1.5" aria-hidden>
                <span className="absolute inset-0 animate-ping rounded-full bg-ok opacity-60 motion-reduce:animate-none" />
                <span className="relative size-1.5 rounded-full bg-ok" />
              </span>
              {t('badge')}
            </span>
            {t('badgeNote')}
          </p>

          {/* Two lines on purpose: the claim, then who it's for, in a quieter tone. */}
          <h1 className="animate-rise rise-2 mt-7 text-5xl text-balance sm:text-7xl lg:text-8xl">
            <span className="block">{t('title.line1')}</span>
            <span className="block text-foreground/45">{t('title.line2')}</span>
          </h1>

          <p className="animate-rise rise-3 mt-6 max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl">
            {t('subtitle')}
          </p>

          <div className="animate-rise rise-4 mt-9 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink
              href={dappPoolsUrl(locale)}
              variant="primary"
              rounded="full"
              padding="none"
              className="group h-12 pr-5 pl-6 font-semibold transition-transform duration-150 ease-out-strong active:scale-97"
            >
              {t('cta.primary')}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </ButtonLink>
            <ButtonLink
              href="/#how-it-works"
              variant="none"
              rounded="full"
              padding="none"
              className="h-12 border border-border bg-card px-6 font-medium transition duration-150 ease-out-strong hover:bg-muted active:scale-97"
            >
              {t('cta.secondary')}
            </ButtonLink>
          </div>
        </div>

        <ConfluencePlate
          className="mt-14 sm:mt-20"
          alt={t('plate.alt')}
          labels={{
            sponsor: t('plate.sponsor'),
            saver: t('plate.saver'),
            merge: t('plate.merge'),
            vest: t('plate.vest'),
          }}
        />
      </div>
    </section>
  );
}
