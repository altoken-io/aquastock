import { getTranslations } from 'next-intl/server';
import {
  MotionDiv,
  MotionText,
} from '@/components/helpers/motion/blur-lazy-motion';
import { Globe2, Store, Briefcase, Building2 } from 'lucide-react';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';

export async function UseCasesSection() {
  const t = await getTranslations('useCases');
  const caseContent = (t.raw as (key: string) => unknown)('cases') as Record<
    string,
    {
      title: string;
      description: string;
    }
  >;
  const cases = [
    {
      id: 'crossBorder',
      icon: Globe2,
      delay: 0.2,
      className: 'lg:col-span-2 lg:row-span-2 min-h-[400px]',
      gradient:
        'from-red-900/20 to-stone-900/5 dark:from-red-900/40 dark:to-black/40',
    },
    {
      id: 'bodegas',
      icon: Store,
      delay: 0.3,
      className: 'lg:col-span-1 lg:row-span-1 min-h-[250px]',
      gradient:
        'from-stone-900/5 to-stone-900/10 dark:from-white/5 dark:to-white/10',
    },
    {
      id: 'smes',
      icon: Briefcase,
      delay: 0.4,
      className: 'lg:col-span-1 lg:row-span-1 min-h-[250px]',
      gradient:
        'from-stone-900/10 to-stone-900/5 dark:from-white/10 dark:to-white/5',
    },
    // {
    //   id: 'individuals',
    //   icon: User,
    //   delay: 0.5,
    //   className: 'lg:col-span-1 lg:row-span-1 min-h-[250px]',
    //   gradient:
    //     'from-stone-900/5 to-stone-900/10 dark:from-white/5 dark:to-white/10',
    // },
    {
      id: 'enterprise',
      icon: Building2,
      delay: 0.6,
      className: 'lg:col-span-2 lg:row-span-1 min-h-[250px]',
      gradient:
        'from-stone-900/10 to-red-900/10 dark:from-white/10 dark:to-red-900/20',
    },
  ].map((entry) => ({
    ...entry,
    ...caseContent[entry.id],
  }));

  return (
    <section
      id="use-cases"
      className="py-10 lg:py-35 relative flex w-full flex-col"
    >
      <div className="px-6 sm:px-12 lg:px-24 mx-auto max-w-7xl">
        <div className="flex flex-col lg:mb-8">
          <RichTextReveal
            as="h2"
            trigger="view"
            start="top"
            className="mb-8 text-5xl md:text-6xl lg:text-7xl leading-[0.9] tracking-tighter"
          >
            {t('title')}
          </RichTextReveal>

          <MotionText delay={0.3} className="mb-8 lg:text-lg font-light">
            {t('subtitle')}
          </MotionText>
        </div>
        <div className="md:grid md:grid-cols-2 md:gap-10">
          {cases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <MotionDiv
                key={useCase.id}
                delay={useCase.delay}
                className="mb-10 md:mb-0"
              >
                <Icon className="size-12 p-2 rounded-2xl bg-primary mb-4 text-primary-foreground" />
                <h3 className="mb-3 text-2xl">{useCase.title}</h3>
                <p className="text-lg font-light">{useCase.description}</p>
              </MotionDiv>
            );
          })}
        </div>
      </div>
    </section>
  );
}
