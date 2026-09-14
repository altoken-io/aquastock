import { getTranslations } from 'next-intl/server';

const FUNDING_SPLIT = { public: 60, private: 35 } as const;

/**
 * The hero's visual anchor, in place of stock photography: a compact
 * instrument-panel reading of the funding model itself — the actual
 * mechanism, on-screen first, per PRODUCT.md's "lead with the funding
 * model" design principle. A fuller version of the same idea lives in
 * `funding-table-preview.tsx`, used further down the page in the Ledger
 * section.
 */
export async function HeroLedgerPanel({ className }: { className?: string }) {
  const t = await getTranslations('project');
  const tHero = await getTranslations('hero');

  return (
    <div className={className} aria-label={tHero('panel.ariaLabel')} role="img">
      <div className="relative overflow-hidden rounded-md border border-border bg-card p-6">
        <span
          aria-hidden="true"
          className="absolute top-0 left-6 h-1.5 w-px bg-border"
        />
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono-ui text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              {tHero('panel.recordLabel')}
            </p>
            <p className="mt-1 text-lg leading-tight text-foreground">
              {tHero('panel.projectName')}
            </p>
          </div>
          <span className="font-mono-ui shrink-0 rounded-sm border border-ok/30 bg-ok/10 px-2 py-1 text-[10px] tracking-[0.14em] text-ok uppercase">
            {t('status.ACTIVE')}
          </span>
        </div>

        <div className="mb-5 flex h-8 w-full overflow-hidden rounded-xs border border-border">
          <div
            style={{ width: `${FUNDING_SPLIT.public}%` }}
            className="flex h-full items-center justify-center bg-public"
          >
            <span className="font-mono-ui text-[10px] font-medium text-public-foreground">
              {FUNDING_SPLIT.public}%
            </span>
          </div>
          <div
            style={{ width: `${FUNDING_SPLIT.private}%` }}
            className="flex h-full items-center justify-center bg-private"
          >
            <span className="font-mono-ui text-[10px] font-medium text-private-foreground">
              {FUNDING_SPLIT.private}%
            </span>
          </div>
          <div className="flex h-full flex-1 items-center justify-center bg-muted">
            <span className="font-mono-ui text-[9px] text-muted-foreground">
              {100 - FUNDING_SPLIT.public - FUNDING_SPLIT.private}%
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t border-dashed border-border pt-5">
          <div>
            <dt className="font-mono-ui text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {t('governmentContribution')}
            </dt>
            <dd className="font-mono-ui mt-1 text-2xl text-public">
              {FUNDING_SPLIT.public}
              <span className="text-sm">%</span>
            </dd>
          </div>
          <div>
            <dt className="font-mono-ui text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {t('communityFunding')}
            </dt>
            <dd className="font-mono-ui mt-1 text-2xl text-private">
              {FUNDING_SPLIT.private}
              <span className="text-sm">%</span>
            </dd>
          </div>
        </dl>
      </div>
      <p className="font-mono-ui mt-3 text-[10px] tracking-[0.1em] text-muted-foreground/70 uppercase">
        {tHero('panel.caption')}
      </p>
    </div>
  );
}
