import { getTranslations } from 'next-intl/server';

// Chart space. Time runs left to right, the vested amount of the match bottom to top.
const W = 560;
const H = 260;
const PAD = { left: 16, right: 16, top: 20, bottom: 16 };
const X0 = PAD.left;
const X1 = W - PAD.right;
const Y0 = H - PAD.bottom;
const Y1 = PAD.top;
// Where "you are": one quarter of the way through.
const HERE = 0.25;
const HX = X0 + (X1 - X0) * HERE;
const HY = Y0 - (Y0 - Y1) * HERE;

/**
 * The vesting rule, drawn: the match rises in a straight line from the day of the deposit.
 * At "you are here" the part below the line is yours; the part above it, still to vest,
 * returns to the sponsor if you leave. Illustrative, and drawn as an SVG so it needs no
 * image and follows the theme.
 */
export async function VestingLine({ className }: { className?: string }) {
  const t = await getTranslations('howItWorks.illustration');

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('label')}
        className="h-auto w-full"
      >
        {/* Time axis. */}
        <line
          x1={X0}
          y1={Y0}
          x2={X1}
          y2={Y0}
          className="stroke-border"
          strokeWidth="1.5"
        />
        {/* Full match, at the end of vesting. */}
        <line
          x1={X0}
          y1={Y1}
          x2={X1}
          y2={Y1}
          className="stroke-border"
          strokeWidth="1"
          strokeDasharray="4 5"
        />
        {/* What has vested by "here": yours. */}
        <polygon
          points={`${X0},${Y0} ${HX},${Y0} ${HX},${HY}`}
          className="fill-ok/25"
        />
        {/* What has not vested yet: it returns to the sponsor if you leave now. */}
        <line
          x1={HX}
          y1={HY}
          x2={HX}
          y2={Y1}
          className="stroke-public"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 7"
        />
        {/* The vesting line itself. */}
        <line
          x1={X0}
          y1={Y0}
          x2={X1}
          y2={Y1}
          className="stroke-public"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1={HX}
          y1={Y0}
          x2={HX}
          y2={HY}
          className="stroke-ok"
          strokeWidth="1.5"
          strokeDasharray="3 4"
        />
        <circle
          cx={HX}
          cy={HY}
          r="7"
          className="fill-background stroke-ok"
          strokeWidth="3"
        />
        <circle cx={X0} cy={Y0} r="4" className="fill-private" />
        <circle cx={X1} cy={Y1} r="4" className="fill-public" />
      </svg>
      {/* Labels are HTML, not SVG text: an SVG scaled to a narrow column shrinks its text to ~5px. */}
      <div className="font-mono-ui mt-1 flex justify-between text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
        <span>{t('start')}</span>
        <span>{t('end')}</span>
      </div>
      <figcaption className="mt-4 flex flex-col gap-2 text-sm text-foreground/80">
        <span className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full border-2 border-ok bg-background"
            aria-hidden="true"
          />
          {t('here')}
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-xs bg-ok/40" aria-hidden="true" />
          {t('vested')}
        </span>
        <span className="flex items-center gap-2">
          <span
            className="h-0 w-2.5 border-t-2 border-dotted border-public"
            aria-hidden="true"
          />
          {t('unvested')}
        </span>
      </figcaption>
    </figure>
  );
}
