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
      className="relative flex w-full flex-col items-center justify-center px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-32"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/15 sm:px-12 sm:py-20 lg:py-24">
        <Image
          src="/assets/brand/early-access-cta.webp"
          alt={t('imageAlt')}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-primary/80" />
        <TextReveal
          as="h2"
          text={t('title')}
          trigger="view"
          start="top"
          className="relative max-w-4xl text-4xl leading-[0.95] tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl"
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
            rounded="full"
            animation="grow"
            className="h-13 bg-white px-6 font-semibold text-neutral-900 shadow-lg shadow-black/10 hover:bg-white/90 sm:min-w-xs"
          >
            <span>{t('cta.primary.label')}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </MotionDiv>
      </div>
    </section>
  );
}
