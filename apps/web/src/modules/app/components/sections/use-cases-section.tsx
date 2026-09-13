import { getTranslations } from 'next-intl/server';
import { Landmark, TrendingUp, Users, Waves } from 'lucide-react';

import {
  MotionDiv,
  MotionText,
} from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';
import { cn } from '@/utils/classNames';

const CASES = [
  {
    id: 'government',
    icon: Landmark,
    tone: 'bg-public/10 text-public',
    accent: 'before:bg-public',
  },
  {
    id: 'community',
    icon: Users,
    tone: 'bg-private/10 text-private',
    accent: 'before:bg-private',
  },
  {
    id: 'investors',
    icon: TrendingUp,
    tone: 'bg-primary/10 text-primary',
    accent: 'before:bg-primary',
  },
  {
    id: 'generalized',
    icon: Waves,
    tone: 'bg-muted text-muted-foreground',
    accent: 'before:bg-muted-foreground/40',
  },
] as const;

export async function UseCasesSection() {
  const t = await getTranslations('useCases');
  const caseContent = (t.raw as (key: string) => unknown)('cases') as Record<
    string,
    { title: string; description: string }
  >;

  return (
    <section
      id="use-cases"
      className="relative flex w-full flex-col py-10 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-24">
        <div className="mb-16 flex flex-col lg:mb-20 lg:max-w-xl">
          <RichTextReveal
            as="h2"
            trigger="view"
            start="top"
            className="mb-6 text-5xl leading-[0.95] tracking-tighter md:text-6xl lg:text-7xl"
          >
            {t('title')}
          </RichTextReveal>
          <MotionText delay={0.3} className="text-lg text-muted-foreground">
            {t('subtitle')}
          </MotionText>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {CASES.map((useCase, index) => {
            const Icon = useCase.icon;
            const content = caseContent[useCase.id];
            return (
              <MotionDiv
                key={useCase.id}
                delay={0.2 + index * 0.1}
                className={cn(
                  'relative overflow-hidden rounded-2xl border border-border bg-card p-7 before:absolute before:inset-x-0 before:top-0 before:h-1',
                  useCase.accent,
                )}
              >
                <span
                  className={cn(
                    'mb-5 flex size-12 items-center justify-center rounded-xl',
                    useCase.tone,
                  )}
                >
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mb-2 text-xl text-foreground">
                  {content.title}
                </h3>
                <p className="text-base text-muted-foreground">
                  {content.description}
                </p>
              </MotionDiv>
            );
          })}
        </div>
      </div>
    </section>
  );
}
