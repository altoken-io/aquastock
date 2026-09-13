import { getTranslations } from 'next-intl/server';
import { MotionDiv } from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';

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
  ];

  return (
    <section
      id="how-it-works"
      className="relative flex w-full flex-col items-center justify-center overflow-hidden py-10 lg:py-40"
    >
      <div className="container relative z-10 mx-auto max-w-7xl px-6 sm:px-12 lg:px-24">
        {/* Header */}
        <div className="mb-24 flex flex-col items-center text-center">
          {/*<MotionDiv
            delay={0.1}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-900/15 bg-white/75 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-red-900 backdrop-blur-xl dark:border-red-700/30 dark:bg-red-950/20 dark:text-red-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-700 dark:bg-red-500" />
            {t('badge')}
          </MotionDiv>*/}

          <RichTextReveal
            as="h2"
            trigger="view"
            className="mb-6 text-5xl md:text-6xl lg:text-7xl tracking-tighter"
          >
            {/*{t.rich('title', {
              gradient: (chunks) => (
                <span className="text-primary">{chunks}</span>
              ),
            })}*/}
            {t('title')}
          </RichTextReveal>

          {/*<MotionText delay={0.3} className="max-w-2xl text-lg text-foreground">
            {t('subtitle')}
          </MotionText>*/}
        </div>

        {/* Steps Grid */}
        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
          {/* Connecting Line (Desktop) */}
          <div className="absolute left-1/8 top-8 hidden h-px w-3/4 bg-foreground/10 lg:block" />

          {steps.map((step, index) => {
            return (
              <MotionDiv
                key={step.id}
                delay={0.4 + index * 0.1}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 mb-8 flex h-16 w-16 items-center justify-center rounded-full text-2xl bg-primary text-primary-foreground">
                  {step.order}
                </div>

                <h3 className="mb-4 text-2xl font-bold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="max-w-sm text-lg font-light">
                  {step.description}
                </p>
              </MotionDiv>
            );
          })}
        </div>

        {/* Visual Diagram */}
        {/*<MotionDiv
          delay={0.7}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-stone-900/10 bg-white/50 p-8 backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-950/50 sm:p-12"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(127,29,29,0.03)_0%,transparent_100%)] dark:bg-[linear-gradient(135deg,rgba(220,38,38,0.03)_0%,transparent_100%)]" />

          <div className="relative z-10 flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="flex flex-col items-center gap-4 opacity-50 grayscale filter transition-all duration-500 hover:opacity-100 hover:grayscale-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-900/20 bg-stone-100 dark:border-white/20 dark:bg-neutral-900">
                <Building2 className="h-6 w-6 text-stone-600 dark:text-stone-400" />
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
                Legacy Banks
              </span>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-2">
              <div className="flex w-full items-center gap-2">
                <div className="h-px flex-1 bg-stone-900/20 dark:bg-white/20" />
                <div className="rounded-full border border-red-900/20 bg-red-50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-red-900 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-400">
                  Solana Network
                </div>
                <div className="h-px flex-1 bg-stone-900/20 dark:bg-white/20" />
              </div>
              <span className="font-mono text-[10px] text-stone-400">
                Instant • Near-Zero Cost
              </span>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-red-900/20 bg-white shadow-[0_0_30px_rgba(127,29,29,0.15)] dark:border-red-500/30 dark:bg-neutral-900 dark:shadow-[0_0_30px_rgba(220,38,38,0.15)]">
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-red-900/10 to-transparent dark:from-red-500/10" />
                <Wallet className="relative z-10 h-6 w-6 text-red-800 dark:text-red-500" />
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-stone-950 dark:text-white">
                AquaStock
              </span>
            </div>
          </div>
        </MotionDiv>*/}

        {/* Summary Line */}
        {/*<MotionDiv delay={0.8} className="mt-24 text-center">
          <p className="font-serif text-xl italic text-foreground sm:text-2xl">
            &ldquo;{t('summary')}&rdquo;
          </p>
        </MotionDiv>*/}
      </div>
    </section>
  );
}
