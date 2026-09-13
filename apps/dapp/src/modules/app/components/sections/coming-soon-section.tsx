import { ComponentProps } from 'react';

import { getLocale, getTranslations } from 'next-intl/server';

import { cn } from '@/utils/classNames';

type ComingSoonProps = ComponentProps<'section'>;

export async function ComingSoonSection({
  className,
  ...props
}: ComingSoonProps) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'common' });
  return (
    <section
      className={cn(
        'bg-linear-to-b bg-neutral-50 dark:bg-black w-full',
        className,
      )}
      {...props}
    >
      <section className="relative container mx-auto flex flex-col gap-6 items-center px-8 py-48 text-center max-sm:px-4 max-sm:py-24">
        <h1 className="text-9xl font-bold uppercase max-lg:text-6xl max-sm:text-5xl">
          {t('comingSoon.title')}
        </h1>
        <p className="text-muted-foreground text-lg max-sm:text-base">
          {t.rich('comingSoon.description', {
            gradient: (chunks) => (
              <span className="gradient-text underline decoration-emerald-400/75">
                {chunks}
              </span>
            ),
          })}
        </p>
      </section>
    </section>
  );
}
