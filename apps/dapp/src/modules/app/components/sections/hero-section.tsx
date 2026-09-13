import { getTranslations } from 'next-intl/server';

import {
  MotionDiv,
  MotionH1,
  MotionH2,
  MotionText,
  MotionVideo,
} from '@/components/helpers/motion/blur-lazy-motion';
import ButtonLink from '@/components/ui/button-link';
import { ArrowRight } from 'lucide-react';

export async function HeroSection() {
  const t = await getTranslations('hero');

  return (
    <section className="relative flex h-screen w-full items-center overflow-hidden max-sm:px-4 px-8 py-24">
      <MotionVideo
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        delay={0.1}
      >
        <source src="/assets/videos/hero-4-faded.mp4" type="video/mp4" />
      </MotionVideo>
      <div className="absolute inset-0 bg-linear-to-b bg-gradient-secondary via-neutral-950/5 dark:via-neutral-950/25" />

      <div className="relative container z-10 mx-auto flex w-full flex-col justify-between h-full">
        <div className="flex flex-col gap-6 max-w-2xl">
          <MotionH1 className="title-xs" delay={0.2}>
            {t.rich('title', {
              gradient: (chunks) => (
                <span className="gradient-text">{chunks}</span>
              ),
              underline: (chunks) => (
                <span className="underline decoration-2 underline-offset-8">
                  {chunks}
                </span>
              ),
            })}
          </MotionH1>
          <MotionH2 className="subtitle" delay={0.3}>
            {t('subtitle')}
          </MotionH2>
        </div>
        <MotionDiv className="flex flex-col gap-6 self-end bg-emerald-400/10 rounded-lg p-6">
          <MotionText className="description max-w-2xl" delay={0.4}>
            {t('description')}
          </MotionText>
          <MotionDiv
            className="mt-4 flex flex-wrap items-center gap-4"
            delay={0.5}
          >
            <ButtonLink href={t('cta.primary.href')} variant="gradient">
              {t('cta.primary.label')}
            </ButtonLink>
            <ButtonLink href={t('cta.secondary.href')} variant="solidLight">
              {t('cta.secondary.label')}
              <ArrowRight className="w-4 h-4" />
            </ButtonLink>
          </MotionDiv>
        </MotionDiv>
      </div>
    </section>
  );
}
