import { getTranslations } from 'next-intl/server';
import { Landmark, WalletMinimal, type LucideIcon } from 'lucide-react';
import { Marquee } from '@aquastock/animation/motion/components/marquee';

import { stringList } from '@/modules/app/utils/guards';
import { cn } from '@/utils/classNames';

// The two currents of every pool, flowing past in opposite directions. Each row carries its
// icon, its label and its stream colour, never the colour alone.
const ROWS: readonly {
  id: 'sponsor' | 'saver';
  icon: LucideIcon;
  tone: string;
  dot: string;
  reverse: boolean;
}[] = [
  {
    id: 'sponsor',
    icon: Landmark,
    tone: 'text-public',
    dot: 'bg-public',
    reverse: false,
  },
  {
    id: 'saver',
    icon: WalletMinimal,
    tone: 'text-private',
    dot: 'bg-private',
    reverse: true,
  },
];

export async function SidesMarqueeSection() {
  const t = await getTranslations('useCases.marquee');

  return (
    <section aria-labelledby="sides-title" className="w-full py-14 sm:py-20">
      <h2
        id="sides-title"
        className="px-4 text-center font-mono-ui text-xs font-normal tracking-[0.18em] text-muted-foreground uppercase"
      >
        {t('title')}
      </h2>

      <div className="mt-8 flex flex-col gap-4">
        {ROWS.map((row) => {
          const Icon = row.icon;
          const items = stringList(t.raw(`${row.id}.items`));
          return (
            <div
              key={row.id}
              className="flex flex-col gap-3 md:flex-row md:items-center md:gap-0"
            >
              {/* Readers get the list once; the moving copies below are decoration. */}
              <p className="sr-only">
                {t(`${row.id}.label`)}: {items.join(', ')}
              </p>
              {/* The row's key: which side of the pool these are. */}
              <span
                aria-hidden
                className={cn(
                  'mx-auto flex w-fit shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium shadow-xs md:mx-0 md:ml-8 md:w-40 md:justify-center',
                  row.tone,
                )}
              >
                <Icon className="size-4" />
                {t(`${row.id}.label`)}
              </span>
              <Marquee
                aria-hidden
                reverse={row.reverse}
                pauseOnHover
                repeat={3}
                className="edge-fade min-w-0 flex-1 p-0 [--duration:70s] [--gap:0rem]"
              >
                {items.map((item) => (
                  <span
                    key={item}
                    className="flex items-center font-headline text-2xl font-medium tracking-tight whitespace-nowrap text-foreground/80 sm:text-3xl"
                  >
                    {item}
                    <span
                      className={cn(
                        'mx-6 size-2 rounded-full sm:mx-9',
                        row.dot,
                      )}
                    />
                  </span>
                ))}
              </Marquee>
            </div>
          );
        })}
      </div>
    </section>
  );
}
