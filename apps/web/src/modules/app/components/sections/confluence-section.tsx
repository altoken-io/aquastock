import { getTranslations } from 'next-intl/server';

import {
  MotionDiv,
  MotionText,
} from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';
import { ConfluenceVisual } from '@/modules/app/components/confluence-visual';
import { FundingTablePreview } from '@/modules/app/components/funding-table-preview';

export async function ConfluenceSection() {
  const t = await getTranslations('confluence');
  const tProject = await getTranslations('project');

  return (
    <section id="confluence" className="relative w-full py-10 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-24">
        <div className="mb-16 max-w-2xl lg:mb-20">
          <p className="mb-4 text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {t('eyebrow')}
          </p>
          <RichTextReveal
            as="h2"
            trigger="view"
            className="mb-6 text-4xl leading-[0.95] tracking-[-0.03em] sm:text-5xl"
          >
            {t('title')}
          </RichTextReveal>
          <MotionText
            delay={0.2}
            className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t('subtitle')}
          </MotionText>
        </div>

        <div className="relative grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Seam marker: visualizes the two positions converging into one
              funding table — the brand's "Confluence" north star. */}
          <div
            aria-hidden="true"
            className="absolute inset-y-6 left-1/2 hidden w-px -translate-x-1/2 lg:block"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent to-public" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-private to-transparent" />
            <span className="absolute top-1/2 left-1/2 flex size-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-ping motion-reduce:hidden" />
              <span className="relative size-3 rounded-full bg-primary ring-8 ring-primary/15" />
            </span>
          </div>

          <MotionDiv delay={0.15}>
            <p className="mb-4 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t('visual.label')}
            </p>
            <ConfluenceVisual className="aspect-square w-full sm:aspect-video lg:aspect-square" />
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-2 text-foreground/80">
                <span
                  className="size-2 rounded-full bg-public"
                  aria-hidden="true"
                />
                {tProject('governmentContribution')}
              </span>
              <span className="flex items-center gap-2 text-foreground/80">
                <span
                  className="size-2 rounded-full bg-private"
                  aria-hidden="true"
                />
                {tProject('communityFunding')}
              </span>
            </div>
          </MotionDiv>

          <MotionDiv delay={0.25}>
            <p className="mb-4 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t('preview.label')}
            </p>
            <FundingTablePreview />
          </MotionDiv>
        </div>
      </div>
    </section>
  );
}
