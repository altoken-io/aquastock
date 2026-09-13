import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { MotionDiv } from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';
import ButtonLink from '@/components/ui/button-link';

export async function HeroSection() {
  const t = await getTranslations('hero');
  const tProject = await getTranslations('project');

  return (
    <section
      id="home"
      className="relative flex w-full items-center overflow-hidden px-4 pt-32 pb-16 sm:px-10 sm:pt-40 lg:px-10 lg:pt-44 xl:px-20 2xl:px-36"
    >
      <div className="grid w-full items-center gap-16 lg:grid-cols-2 lg:gap-12">
        <div>
          <MotionDiv className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            {t('usersCount')}
          </MotionDiv>

          <RichTextReveal
            as="h1"
            trigger="load"
            stagger={0.03}
            className="mb-6 text-4xl sm:text-5xl md:text-6xl xl:text-7xl"
          >
            {t('title')}
          </RichTextReveal>

          <MotionDiv
            delay={0.3}
            className="mb-4 max-w-prose text-lg text-foreground/90 xl:text-xl"
          >
            {t('subtitle')}
          </MotionDiv>
          <MotionDiv
            delay={0.4}
            className="mb-8 max-w-prose text-base text-foreground/60 xl:text-lg"
          >
            {t('description')}
          </MotionDiv>

          <MotionDiv
            delay={0.5}
            className="mb-8 flex flex-wrap items-center gap-3"
          >
            <ButtonLink
              variant="primary"
              rounded="full"
              padding="lg"
              href={t('cta.primary.href')}
              className="h-12 font-medium"
            >
              {t('cta.primary.label')}
            </ButtonLink>
            <ButtonLink
              variant="outline"
              rounded="full"
              padding="lg"
              href={t('cta.secondary.href')}
              className="h-12 font-medium"
            >
              {t('cta.secondary.label')}
            </ButtonLink>
          </MotionDiv>

          <MotionDiv delay={0.6} className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-public/25 bg-public/8 px-3 py-1.5 text-xs font-medium text-public">
              <span className="size-1.5 rounded-full bg-public" />
              {tProject('governmentContribution')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-private/25 bg-private/8 px-3 py-1.5 text-xs font-medium text-private">
              <span className="size-1.5 rounded-full bg-private" />
              {tProject('communityFunding')}
            </span>
          </MotionDiv>
        </div>

        <MotionDiv
          delay={0.3}
          direction="horizontal"
          x={24}
          className="relative hidden aspect-4/5 w-full max-w-md justify-self-end overflow-hidden rounded-3xl lg:block"
        >
          <Image
            src="/assets/brand/hero-infrastructure-placeholder.svg"
            alt="Water infrastructure — reservoir and treatment plant"
            fill
            priority
            className="object-cover"
          />
        </MotionDiv>
      </div>
    </section>
  );
}
