import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import {
  MotionDiv,
  MotionText,
} from '@/components/helpers/motion/blur-lazy-motion';
import ButtonLink from '@/components/ui/button-link';
import { TextReveal } from '@/components/helpers/motion/text-reveal';
import { DAPP_BASE_URL } from '@/lib/dapp-url';
import { ArrowRight } from 'lucide-react';

export async function EarlyAccessCtaSection() {
  const t = await getTranslations('earlyAccessCta');

  return (
    <section
      id="early-access"
      className="relative flex w-full flex-col items-center justify-center px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-32 xl:pl-32"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center overflow-hidden rounded-md border border-border px-6 py-16 text-center sm:px-12 sm:py-20 lg:py-24">
        <Image
          src="/assets/brand/site-notice.webp"
          alt={t('imageAlt')}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-primary/85" />
        <span
          aria-hidden="true"
          className="font-mono-ui absolute top-6 left-6 rounded-sm border border-primary-foreground/25 px-2 py-1 text-[10px] tracking-[0.18em] text-primary-foreground/70 uppercase"
        >
          {t('notice.tag')}
        </span>

        <TextReveal
          as="h2"
          text={t('title')}
          trigger="view"
          start="top"
          className="relative max-w-4xl text-4xl leading-[0.98] tracking-tight text-balance text-primary-foreground sm:text-5xl lg:text-6xl"
        />

        <MotionText
          className="relative mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/80 sm:text-lg"
          delay={0.2}
        >
          {t('subtitle')}
        </MotionText>

        <MotionDiv delay={0.3} className="relative mt-9">
          <ButtonLink
            href={DAPP_BASE_URL}
            variant="none"
            rounded="md"
            animation="grow"
            className="h-13 bg-background px-6 font-semibold text-foreground shadow-lg shadow-black/10 hover:bg-background/90 sm:min-w-xs"
          >
            <span>{t('cta.primary.label')}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </MotionDiv>
      </div>
    </section>
  );
}
