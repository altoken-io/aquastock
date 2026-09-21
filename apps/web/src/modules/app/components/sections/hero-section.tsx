import { getTranslations } from 'next-intl/server';

import { MotionDiv } from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';
import ButtonLink from '@/components/ui/button-link';
import { HeroLedgerPanel } from '@/modules/app/components/hero-ledger-panel';

export async function HeroSection() {
  const t = await getTranslations('hero');

  return (
    <section
      id="home"
      className="relative flex w-full items-center overflow-hidden pt-32 pb-16 sm:pt-40 lg:pt-44"
    >
      <div className="mx-auto grid w-full max-w-7xl items-start gap-16 px-6 sm:px-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-24 xl:pl-32">
        <div>
          <MotionDiv className="font-mono-ui mb-6 inline-flex items-center gap-2 rounded-sm border border-border/70 bg-muted/60 px-3 py-1 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            <span className="size-1.5 rounded-full bg-primary" />
            {t('usersCount')}
          </MotionDiv>

          <RichTextReveal
            as="h1"
            trigger="load"
            stagger={0.03}
            className="mb-6 max-w-2xl text-4xl sm:text-5xl md:text-6xl xl:text-[4.5rem] xl:leading-[0.98]"
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

          <MotionDiv delay={0.5} className="flex flex-wrap items-center gap-3">
            <ButtonLink
              variant="primary"
              rounded="md"
              padding="lg"
              href={t('cta.primary.href')}
              className="h-12 font-medium"
            >
              {t('cta.primary.label')}
            </ButtonLink>
            <ButtonLink
              variant="outline"
              rounded="md"
              padding="lg"
              href={t('cta.secondary.href')}
              className="h-12 font-medium"
            >
              {t('cta.secondary.label')}
            </ButtonLink>
          </MotionDiv>

          <MotionDiv
            delay={0.6}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/70 pt-6 text-sm"
          >
            <span className="flex items-center gap-2 text-foreground/80">
              <span
                className="size-2 rounded-full bg-public"
                aria-hidden="true"
              />
              {t('legend.sponsor')}
            </span>
            <span className="flex items-center gap-2 text-foreground/80">
              <span
                className="size-2 rounded-full bg-private"
                aria-hidden="true"
              />
              {t('legend.saver')}
            </span>
            <span className="font-mono-ui text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              {t('legend.sameTable')}
            </span>
          </MotionDiv>
        </div>

        <MotionDiv
          delay={0.35}
          direction="horizontal"
          x={24}
          className="lg:pt-2"
        >
          <HeroLedgerPanel />
        </MotionDiv>
      </div>
    </section>
  );
}
