import { getTranslations } from 'next-intl/server';

import {
  MergeVisual,
  RulesVisual,
  VestVisual,
} from '@/modules/app/components/step-visuals';
import { PAGE_CONTAINER } from '@/modules/app/utils/layout';

const STEP_IDS = ['fund', 'deposit', 'vest'] as const;

export async function HowItWorksSection() {
  const t = await getTranslations('howItWorks');

  // A real sequence (fund, then deposit, then vest), so the cards are numbered.
  const visuals = {
    fund: (
      <RulesVisual
        labels={{
          example: t('visual.example'),
          locked: t('visual.locked'),
          rate: t('visual.rate'),
          cap: t('visual.cap'),
          vesting: t('visual.vesting'),
          months: t('visual.months', { count: 12 }),
        }}
      />
    ),
    deposit: (
      <MergeVisual
        labels={{
          you: t('visual.you'),
          match: t('visual.match'),
          reserved: t('visual.reserved'),
        }}
      />
    ),
    vest: (
      <VestVisual
        labels={{
          vested: t('visual.vested'),
          month: t('visual.month', { month: 12 }),
        }}
      />
    ),
  };

  return (
    <section id="how-it-works" className="w-full py-20 sm:py-28">
      <div className={PAGE_CONTAINER}>
        <h2 className="reveal max-w-xl text-4xl text-balance sm:text-6xl">
          {t('title')}
        </h2>

        <ol className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-3">
          {STEP_IDS.map((id, index) => (
            <li
              key={id}
              className="reveal flex flex-col rounded-3xl border border-border bg-card p-2 shadow-xs"
            >
              <div
                aria-hidden
                className="flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-muted/70 px-6"
              >
                {visuals[id]}
              </div>
              <div className="flex flex-1 flex-col px-5 pt-6 pb-5">
                <span className="font-mono-ui text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-2xl text-balance">
                  {t(`steps.${id}.title`)}
                </h3>
                <p className="mt-2 text-pretty text-muted-foreground">
                  {t(`steps.${id}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
