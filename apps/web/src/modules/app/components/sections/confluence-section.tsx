import { getTranslations } from 'next-intl/server';

import { MotionText } from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';
import { ConfluenceVisual } from '@/modules/app/components/confluence-visual';
import { FundingTablePreview } from '@/modules/app/components/funding-table-preview';

export async function ConfluenceSection() {
  const t = await getTranslations('confluence');

  return (
    <section id="confluence" className="relative w-full py-10 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
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
              className="mb-8 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {t('subtitle')}
            </MotionText>
            <ConfluenceVisual className="aspect-video w-full" />
          </div>

          <div>
            <p className="mb-4 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t('preview.label')}
            </p>
            <FundingTablePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
