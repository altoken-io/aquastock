import { getTranslations } from 'next-intl/server';
import {
  Languages,
  UserRoundX,
  WalletMinimal,
  type LucideIcon,
} from 'lucide-react';

import { WorldGlobe } from '@/modules/app/components/world-globe';
import { PAGE_CONTAINER } from '@/modules/app/utils/layout';

const CHIPS: readonly {
  id: 'wallet' | 'signup' | 'languages';
  icon: LucideIcon;
}[] = [
  { id: 'wallet', icon: WalletMinimal },
  { id: 'signup', icon: UserRoundX },
  { id: 'languages', icon: Languages },
];

export async function WorldSection() {
  const t = await getTranslations('useCases.world');

  return (
    <section id="anywhere" className="w-full py-6 sm:py-10">
      <div className={PAGE_CONTAINER}>
        <div className="relative isolate grid overflow-hidden rounded-plate bg-abyss text-abyss-foreground lg:grid-cols-12">
          {/* Light coming up through the deep water, behind the globe. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-radial-[at_85%_60%] from-abyss-primary/15 via-transparent to-transparent"
          />

          <div className="reveal relative z-10 px-6 pt-12 pb-4 sm:px-12 sm:pt-16 lg:col-span-6 lg:py-24 lg:pr-0 lg:pl-16">
            <p className="font-mono-ui text-xs tracking-[0.18em] text-abyss-primary uppercase">
              {t('eyebrow')}
            </p>
            <h2 className="mt-5 text-4xl text-balance sm:text-5xl lg:text-6xl">
              <span className="block">{t('title.lead')}</span>
              <span className="block text-abyss-foreground/50">
                {t('title.rest')}
              </span>
            </h2>
            <p className="mt-6 max-w-md text-lg text-pretty text-abyss-muted">
              {t('body')}
            </p>

            <ul className="mt-8 flex flex-wrap gap-2">
              {CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <li
                    key={chip.id}
                    className="flex items-center gap-2 rounded-full border border-abyss-border bg-abyss-foreground/5 px-3.5 py-1.5 text-sm"
                  >
                    <Icon className="size-4 text-abyss-primary" aria-hidden />
                    {t(`chips.${chip.id}`)}
                  </li>
                );
              })}
            </ul>

            <div className="mt-10 border-t border-abyss-border pt-5 text-sm text-abyss-muted">
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                <li className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full bg-abyss-sponsor"
                    aria-hidden
                  />
                  {t('legend.sponsor')}
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full bg-abyss-saver"
                    aria-hidden
                  />
                  {t('legend.saver')}
                </li>
                <li>{t('legend.note')}</li>
              </ul>
              <p className="mt-2 text-xs">{t('source')}</p>
            </div>
          </div>

          {/* The globe rises out of the bottom edge on phones and sits to the right from lg. */}
          <div className="relative -mb-[38%] lg:col-span-6 lg:mb-0">
            <WorldGlobe className="mx-auto w-full max-w-xl lg:absolute lg:top-1/2 lg:-right-16 lg:w-[125%] lg:max-w-none lg:-translate-y-1/2" />
          </div>
        </div>
      </div>
    </section>
  );
}
