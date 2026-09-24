import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';

import ButtonLink from '@/components/ui/button-link';
import { dappPoolsUrl, dappUrl } from '@/lib/dapp-url';
import blend from '@/modules/app/assets/confluence-blend.webp';
import { PAGE_CONTAINER } from '@/modules/app/utils/layout';

export async function EarlyAccessCtaSection() {
  const [t, locale] = await Promise.all([
    getTranslations('earlyAccessCta'),
    getLocale(),
  ]);

  return (
    <section id="get-started" className="w-full pt-4 pb-20 sm:pb-28">
      <div className={PAGE_CONTAINER}>
        {/* Downstream of the hero: the two waters, now one. */}
        <div className="reveal relative isolate overflow-hidden rounded-plate bg-abyss text-abyss-foreground">
          <Image
            src={blend}
            alt=""
            placeholder="blur"
            sizes="(min-width: 80rem) 76rem, calc(100vw - 2rem)"
            className="absolute inset-0 -z-10 size-full object-cover object-right"
          />
          {/* Keeps the copy on the dark water, whatever the crop. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-r from-abyss via-abyss/75 to-transparent sm:via-abyss/55"
          />

          <div className="flex min-h-104 flex-col justify-center px-6 py-14 sm:px-12 sm:py-20 lg:px-16">
            <h2 className="max-w-xl text-4xl text-balance sm:text-6xl">
              {t('title')}
            </h2>
            <p className="mt-5 max-w-md text-lg text-pretty text-abyss-muted">
              {t('subtitle')}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={dappPoolsUrl(locale)}
                variant="none"
                rounded="full"
                padding="none"
                className="group h-12 bg-abyss-foreground pr-5 pl-6 font-semibold text-abyss transition duration-150 ease-out-strong hover:bg-white active:scale-97"
              >
                {t('cta')}
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </ButtonLink>
              <ButtonLink
                href={dappUrl(locale, '/my-match')}
                variant="none"
                rounded="full"
                padding="none"
                className="h-12 border border-abyss-foreground/25 px-6 font-medium text-abyss-foreground transition duration-150 ease-out-strong hover:bg-abyss-foreground/10 active:scale-97"
              >
                {t('secondary')}
              </ButtonLink>
            </div>
            <p className="mt-10 text-sm text-abyss-muted">{t('note')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
