import { getTranslations } from 'next-intl/server';
import { Building2, Coins, PiggyBank, Users } from 'lucide-react';

import {
  MotionDiv,
  MotionText,
} from '@/components/helpers/motion/blur-lazy-motion';
import { RichTextReveal } from '@/components/helpers/motion/rich-text-reveal';
import { cn } from '@/utils/classNames';

const CASES = [
  {
    id: 'employers',
    icon: Building2,
    tag: 'EMP',
    accent: 'border-l-public text-public',
  },
  {
    id: 'communities',
    icon: Users,
    tag: 'COM',
    accent: 'border-l-private text-private',
  },
  {
    id: 'protocols',
    icon: Coins,
    tag: 'PRO',
    accent: 'border-l-primary text-primary',
  },
  {
    id: 'savers',
    icon: PiggyBank,
    tag: 'YOU',
    accent: 'border-l-muted-foreground/40 text-muted-foreground',
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
      className="relative flex w-full flex-col py-20 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-24 xl:pl-32">
        <div className="mb-16 flex flex-col border-b border-border pb-10 lg:mb-20 lg:max-w-xl">
          <p className="font-mono-ui mb-4 text-[11px] tracking-[0.2em] text-primary uppercase">
            {t('badge')}
          </p>
          <RichTextReveal
            as="h2"
            trigger="view"
            start="top"
            className="mb-6 text-5xl leading-[0.98] tracking-tight md:text-6xl lg:text-7xl"
          >
            {t('title')}
          </RichTextReveal>
          <MotionText delay={0.3} className="text-lg text-muted-foreground">
            {t('subtitle')}
          </MotionText>
        </div>

        <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
          {CASES.map((useCase, index) => {
            const Icon = useCase.icon;
            const content = caseContent[useCase.id];
            return (
              <MotionDiv
                key={useCase.id}
                delay={0.2 + index * 0.1}
                className={cn(
                  'relative flex flex-col gap-4 border-l-4 bg-card p-7',
                  useCase.accent,
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="font-mono-ui text-[10px] tracking-[0.2em] uppercase">
                    {useCase.tag}
                  </span>
                </div>
                <div>
                  <h3 className="mb-2 text-xl text-foreground">
                    {content.title}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {content.description}
                  </p>
                </div>
              </MotionDiv>
            );
          })}
        </div>
      </div>
    </section>
  );
}
