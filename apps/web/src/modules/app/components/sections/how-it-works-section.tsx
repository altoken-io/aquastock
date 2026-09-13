import { getTranslations } from 'next-intl/server';
import { MotionDiv } from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';
import { cn } from '@/utils/classNames';

const STEP_TONE = {
  first: 'bg-primary text-primary-foreground',
  second: 'bg-public text-public-foreground',
  third: 'bg-private text-private-foreground',
  fourth: 'bg-primary text-primary-foreground',
} as const;

export async function HowItWorksSection() {
  const t = await getTranslations('howItWorks');

  const steps = [
    {
      id: 'first',
      order: 1,
      title: t('steps.firstStep.title'),
      description: t('steps.firstStep.description'),
    },
    {
      id: 'second',
      order: 2,
      title: t('steps.secondStep.title'),
      description: t('steps.secondStep.description'),
    },
    {
      id: 'third',
      order: 3,
      title: t('steps.thirdStep.title'),
      description: t('steps.thirdStep.description'),
    },
    {
      id: 'fourth',
      order: 4,
      title: t('steps.fourthStep.title'),
      description: t('steps.fourthStep.description'),
    },
  ] as const;

  return (
    <section
      id="how-it-works"
      className="relative flex w-full flex-col items-center justify-center overflow-hidden py-10 lg:py-40"
    >
      <div className="container relative z-10 mx-auto max-w-7xl px-6 sm:px-12 lg:px-24">
        <div className="mb-24 flex flex-col items-center text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {t('badge')}
          </p>
          <RichTextReveal
            as="h2"
            trigger="view"
            start="top"
            className="mb-6 text-5xl tracking-tighter md:text-6xl lg:text-7xl"
          >
            {t('title')}
          </RichTextReveal>
          <MotionDiv
            delay={0.2}
            className="max-w-2xl text-lg text-muted-foreground"
          >
            {t('subtitle')}
          </MotionDiv>
        </div>

        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
          <div className="absolute top-8 left-1/8 hidden h-px w-3/4 bg-border lg:block" />

          {steps.map((step, index) => (
            <MotionDiv
              key={step.id}
              delay={0.4 + index * 0.1}
              className="relative flex flex-col items-center text-center"
            >
              <div
                className={cn(
                  'relative z-10 mb-8 flex h-16 w-16 items-center justify-center rounded-full text-2xl',
                  STEP_TONE[step.id],
                )}
              >
                {step.order}
              </div>

              <h3 className="mb-4 text-2xl text-foreground">{step.title}</h3>
              <p className="max-w-sm text-lg font-light text-muted-foreground">
                {step.description}
              </p>
            </MotionDiv>
          ))}
        </div>

        <MotionDiv delay={0.9} className="mt-20 text-center">
          <p className="text-xl text-foreground/80 sm:text-2xl">
            {t('summary')}
          </p>
        </MotionDiv>
      </div>
    </section>
  );
}
