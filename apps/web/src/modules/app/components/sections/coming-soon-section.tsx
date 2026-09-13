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
        'w-full bg-radial bg-gradient-secondary from-white via-orange-red/95 to-neutral-50',
        className,
      )}
      {...props}
    >
      <section className="relative container mx-auto flex flex-col items-center gap-6 px-8 py-48 text-center max-sm:px-4 max-sm:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-red-700/35 to-transparent" />
        <h1 className="bg-linear-to-r from-rose-900 via-red-700 to-rose-400 bg-clip-text text-9xl font-bold text-transparent uppercase max-lg:text-6xl max-sm:text-5xl">
          {t('comingSoon.title')}
        </h1>
        <p className="max-w-2xl text-lg text-stone-700 max-sm:text-base">
          {t.rich('comingSoon.description', {
            gradient: (chunks) => (
              <span className="bg-linear-to-r from-rose-900 to-red-700 bg-clip-text text-transparent underline decoration-red-700/60">
                {chunks}
              </span>
            ),
          })}
        </p>
      </section>
    </section>
  );
}
