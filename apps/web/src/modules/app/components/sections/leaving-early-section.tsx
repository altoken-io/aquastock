import { getTranslations } from 'next-intl/server';
import { Lock, RotateCcw, SquareSigma, type LucideIcon } from 'lucide-react';

import { leaveEarly, leaveEarlyShares } from '@/modules/app/lib/leave-early';
import { PAGE_CONTAINER } from '@/modules/app/utils/layout';
import { cn } from '@/utils/classNames';

// One illustrative position (labelled as such on the page), left at three points in its term.
const POSITION = { deposit: 100, match: 100, months: 12 } as const;
const LEAVE_AT = [3, 6, 12] as const;

// The three parts of every bar, in the order they're drawn. Each has its legend label, so the
// colours are never the only key.
const PARTS = [
  { id: 'deposit', bar: 'bg-private', text: 'text-private' },
  { id: 'kept', bar: 'bg-ok', text: 'text-ok-text' },
  {
    id: 'returned',
    bar: 'border-2 border-dashed border-public/40 bg-public/10',
    text: 'text-public',
  },
] as const;

const FACTS: readonly {
  id: 'deposit' | 'rules' | 'chain';
  icon: LucideIcon;
}[] = [
  { id: 'deposit', icon: RotateCcw },
  { id: 'rules', icon: Lock },
  { id: 'chain', icon: SquareSigma },
];

export async function LeavingEarlySection() {
  const t = await getTranslations('howItWorks');

  const rows = LEAVE_AT.map((leaveAt) => {
    const result = leaveEarly({ ...POSITION, leaveAt });
    const shares = leaveEarlyShares(result);
    return {
      month: result.month,
      total: result.depositBack + result.matchKept,
      parts: {
        deposit: { amount: result.depositBack, share: shares.deposit },
        kept: { amount: result.matchKept, share: shares.kept },
        returned: { amount: result.matchReturned, share: shares.returned },
      },
    };
  });

  return (
    <section id="leaving-early" className="w-full py-20 sm:py-28">
      <div className={PAGE_CONTAINER}>
        <h2 className="reveal max-w-2xl text-4xl text-balance sm:text-6xl">
          {t('outcomes.title')}
        </h2>

        <div className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-12">
          <article className="reveal flex flex-col rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8 lg:col-span-8">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {PARTS.map((part) => (
                <li key={part.id} className="flex items-center gap-2">
                  <span
                    className={cn('size-3 rounded-xs', part.bar)}
                    aria-hidden
                  />
                  {t(`outcomes.legend.${part.id}`)}
                </li>
              ))}
            </ul>

            <ol className="mt-8 flex flex-1 flex-col justify-center gap-7">
              {rows.map((row) => (
                <li key={row.month}>
                  <span className="sr-only">
                    {t('outcomes.ariaRow', {
                      month: row.month,
                      deposit: row.parts.deposit.amount,
                      kept: row.parts.kept.amount,
                      returned: row.parts.returned.amount,
                    })}
                  </span>
                  <div
                    aria-hidden
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
                  >
                    <span className="font-medium whitespace-nowrap">
                      {t('outcomes.leaveAt', { month: row.month })}
                    </span>
                    <span className="font-mono-ui text-sm whitespace-nowrap text-muted-foreground">
                      {t('outcomes.total', { total: row.total })}
                    </span>
                  </div>
                  {/* The whole position as one bar, filling in as it scrolls into view. */}
                  <div aria-hidden className="fill-in mt-3 flex gap-1">
                    {PARTS.filter((part) => row.parts[part.id].amount > 0).map(
                      (part) => (
                        <div
                          key={part.id}
                          className="min-w-0"
                          // Each part's width is its share of the position: data, not styling.
                          style={{
                            flexGrow: row.parts[part.id].share,
                            flexBasis: 0,
                          }}
                        >
                          <div className={cn('h-9 rounded-lg', part.bar)} />
                          <span
                            className={cn(
                              'mt-1.5 block font-mono-ui text-xs',
                              part.text,
                            )}
                          >
                            {row.parts[part.id].amount}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-8 text-xs text-muted-foreground">
              {t('outcomes.caption')}
            </p>
          </article>

          <ul className="grid gap-4 lg:col-span-4">
            {FACTS.map((fact) => {
              const Icon = fact.icon;
              return (
                <li
                  key={fact.id}
                  className="reveal flex flex-col rounded-3xl border border-border bg-card p-6 shadow-xs"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-xl text-balance">
                    {t(`facts.${fact.id}.title`)}
                  </h3>
                  <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                    {t(`facts.${fact.id}.body`)}
                  </p>
                  {fact.id === 'chain' && (
                    <code className="mt-4 w-fit rounded-lg bg-muted px-2.5 py-1.5 font-mono-ui text-xs text-foreground">
                      {t('facts.chain.formula')}
                    </code>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {t('outcomes.riskNote')}{' '}
          <a
            href="#faq"
            className="rounded-xs font-medium text-foreground underline underline-offset-4 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {t('outcomes.riskLink')}
          </a>
        </p>
      </div>
    </section>
  );
}
