import FaqMenu from '@/components/FaqMenu';
import {
  MotionDiv,
  MotionText,
} from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';
import { getTranslations } from 'next-intl/server';

export async function FaqSection() {
  const t = await getTranslations('faq');
  const ids = [
    'faq1',
    'faq2',
    'faq3',
    'faq4',
    'faq5',
    'faq6',
    'faq7',
    'faq8',
    'faq9',
  ] as const;
  const faqs = ids.map((id) => ({
    question: t(`questions.${id}.question`),
    answer: t(`questions.${id}.answer`),
  }));

  return (
    <section id="faq" className="w-full py-20 sm:py-24 lg:py-32">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 sm:px-12 lg:grid-cols-12 lg:gap-8 lg:px-24 xl:pl-32">
        <div className="lg:col-span-5 lg:pr-12">
          <p className="font-mono-ui mb-4 text-[11px] tracking-[0.2em] text-primary uppercase">
            {t('badge')}
          </p>
          <RichTextReveal
            as="h2"
            trigger="view"
            className="text-4xl leading-[0.98] tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {t('title')}
          </RichTextReveal>
          <MotionText
            delay={0.2}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t('subtitle')}
          </MotionText>
          <MotionDiv
            delay={0.3}
            className="font-mono-ui mt-8 hidden items-center gap-2 rounded-sm border border-border bg-muted/40 px-3 py-1.5 text-[11px] tracking-[0.1em] text-muted-foreground uppercase lg:inline-flex"
          >
            <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" />
            {t('trustNote')}
          </MotionDiv>
        </div>
        <div className="lg:col-span-7">
          <FaqMenu faqs={faqs} />
        </div>
      </div>
    </section>
  );
}
