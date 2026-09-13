import FaqMenu from '@/components/FaqMenu';
import { MotionText } from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';
import { getTranslations } from 'next-intl/server';

export async function FaqSection() {
  const t = await getTranslations('faq');
  const faqs = [
    {
      question: t('questions.faq1.question'),
      answer: t('questions.faq1.answer'),
    },
    {
      question: t('questions.faq2.question'),
      answer: t('questions.faq2.answer'),
    },
    {
      question: t('questions.faq3.question'),
      answer: t('questions.faq3.answer'),
    },
    {
      question: t('questions.faq4.question'),
      answer: t('questions.faq4.answer'),
    },
    {
      question: t('questions.faq5.question'),
      answer: t('questions.faq5.answer'),
    },
    {
      question: t('questions.faq6.question'),
      answer: t('questions.faq6.answer'),
    },
  ];

  return (
    <section id="faq" className="w-full py-20 sm:py-24 lg:py-32">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-10">
        <div className="lg:col-span-5 lg:pr-12">
          <RichTextReveal
            as="h2"
            trigger="view"
            className="text-4xl leading-[0.95] tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl"
          >
            {t('title')}
          </RichTextReveal>
          <MotionText
            delay={0.2}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t('subtitle')}
          </MotionText>
        </div>
        <div className="lg:col-span-7">
          <FaqMenu faqs={faqs} />
        </div>
      </div>
    </section>
  );
}
