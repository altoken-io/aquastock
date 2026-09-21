import { getTranslations } from 'next-intl/server';

// Illustrative numbers, labelled as such on the panel. They are not read from any pool.
const SAMPLE = { deposit: 100, match: 100, vestedPercent: 42 } as const;
const VESTED = (SAMPLE.match * SAMPLE.vestedPercent) / 100;

/**
 * The hero's visual anchor, in place of stock photography: a compact
 * instrument-panel reading of one position, the actual mechanism, on-screen
 * first, per PRODUCT.md's "lead with the mechanism" design principle. What a
 * saver deposited (their own savings), the sponsor's match, and how much of
 * that match has vested. A fuller version of the same idea lives in
 * `leaving-early-preview.tsx`, further down the page.
 */
export async function HeroLedgerPanel({ className }: { className?: string }) {
  const t = await getTranslations('hero');

  return (
    <div className={className} aria-label={t('panel.ariaLabel')} role="img">
      <div className="relative overflow-hidden rounded-md border border-border bg-card p-6">
        <span
          aria-hidden="true"
          className="absolute top-0 left-6 h-1.5 w-px bg-border"
        />
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono-ui text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              {t('panel.recordLabel')}
            </p>
            <p className="mt-1 text-lg leading-tight text-foreground">
              {t('panel.projectName')}
            </p>
          </div>
          <span className="font-mono-ui shrink-0 rounded-sm border border-ok/30 bg-ok/10 px-2 py-1 text-[10px] tracking-[0.14em] text-ok-text uppercase">
            {t('panel.status')}
          </span>
        </div>

        {/* The position: the saver's deposit and the sponsor's match, side by side. The exact
            figures are in the list below, so the bar carries proportion only. */}
        <div
          className="mb-3 flex h-8 w-full overflow-hidden rounded-xs border border-border"
          aria-hidden="true"
        >
          <div className="h-full flex-1 bg-private" />
          <div className="h-full flex-1 bg-public" />
        </div>

        {/* How much of the match has vested. */}
        <div className="mb-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono-ui text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {t('panel.vested')}
            </span>
            <span className="font-mono-ui text-[11px] text-foreground tabular-nums">
              {SAMPLE.vestedPercent}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-xs border border-border bg-muted">
            <div
              className="h-full bg-ok"
              style={{ width: `${SAMPLE.vestedPercent}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t border-dashed border-border pt-5">
          <div>
            <dt className="font-mono-ui text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {t('panel.deposit')}
            </dt>
            <dd className="font-mono-ui mt-1 text-2xl text-private tabular-nums">
              {SAMPLE.deposit}
              <span className="ml-1 text-sm text-muted-foreground">SPYx</span>
            </dd>
          </div>
          <div>
            <dt className="font-mono-ui text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {t('panel.match')}
            </dt>
            <dd className="font-mono-ui mt-1 text-2xl text-public tabular-nums">
              {SAMPLE.match}
              <span className="ml-1 text-sm text-muted-foreground">SPYx</span>
            </dd>
          </div>
          <div>
            <dt className="font-mono-ui text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {t('panel.vested')}
            </dt>
            <dd className="font-mono-ui mt-1 text-lg text-foreground tabular-nums">
              {VESTED}
              <span className="ml-1 text-xs text-muted-foreground">SPYx</span>
            </dd>
          </div>
          <div>
            <dt className="font-mono-ui text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {t('panel.claimable')}
            </dt>
            <dd className="font-mono-ui mt-1 text-lg text-foreground tabular-nums">
              {VESTED}
              <span className="ml-1 text-xs text-muted-foreground">SPYx</span>
            </dd>
          </div>
        </dl>
      </div>
      <p className="font-mono-ui mt-3 text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
        {t('panel.caption')}
      </p>
    </div>
  );
}
