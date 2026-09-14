import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { MotionDiv } from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';
import { cn } from '@/utils/classNames';

const STEP_TONE = {
  first: 'border-primary text-primary',
  second: 'border-public text-public',
  third: 'border-private text-private',
  fourth: 'border-primary text-primary',
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
      className="relative flex w-full flex-col items-center justify-center overflow-hidden py-20 lg:py-40"
    >
      <div className="container relative z-10 mx-auto max-w-7xl px-6 sm:px-12 lg:px-24 xl:pl-32">
        <div className="mb-24 flex flex-col border-b border-border pb-10">
          <p className="font-mono-ui mb-4 text-[11px] tracking-[0.2em] text-primary uppercase">
            {t('badge')}
          </p>
          <RichTextReveal
            as="h2"
            trigger="view"
            start="top"
            className="mb-6 max-w-3xl text-5xl tracking-tight md:text-6xl lg:text-7xl"
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
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-md border border-border lg:aspect-auto lg:h-full">
              <Image
                src="/assets/brand/process-site-verification.webp"
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
              className="absolute top-8 bottom-8 left-7 hidden w-px bg-border sm:block"
            />

            {steps.map((step, index) => (
              <MotionDiv
                key={step.id}
                delay={0.3 + index * 0.1}
                className="relative flex gap-6"
              >
                <div
                  className={cn(
                    'font-mono-ui relative z-10 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border-2 bg-background text-[10px] tracking-[0.05em] uppercase',
                    STEP_TONE[step.id],
                  )}
                >
                  <span className="opacity-70">{t('benchmarkLabel')}</span>
                  <span className="text-base font-medium">
                    {String(step.order).padStart(2, '0')}
                  </span>
                </div>

                <div className="pt-2">
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

        <MotionDiv
          delay={0.9}
          className="mt-20 border-t border-dashed border-border pt-10 text-center"
        >
          <p className="text-xl text-foreground/80 sm:text-2xl">
            {t('summary')}
          </p>
        </MotionDiv>
      </div>
    </section>
  );
}
