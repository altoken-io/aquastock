import Image from 'next/image';
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

        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          <MotionDiv delay={0.2} className="lg:col-span-1">
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-3xl lg:aspect-auto lg:h-full">
              <Image
                src="/assets/brand/how-it-works.webp"
                alt={t('photoAlt')}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
          </MotionDiv>

          <div className="relative flex flex-col gap-10 lg:col-span-2">
            <div
              aria-hidden="true"
              className="absolute top-8 bottom-8 left-8 hidden w-px bg-border sm:block"
            />

            {steps.map((step, index) => (
              <MotionDiv
                key={step.id}
                delay={0.3 + index * 0.1}
                className="relative flex gap-6"
              >
                <div
                  className={cn(
                    'relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl',
                    STEP_TONE[step.id],
                  )}
                >
                  {step.order}
                </div>

                <div className="pt-3">
                  <h3 className="mb-2 text-2xl text-foreground">
                    {step.title}
                  </h3>
                  <p className="max-w-lg text-lg font-light text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </MotionDiv>
            ))}
          </div>
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
