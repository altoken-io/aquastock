import { cn } from '@/utils/classNames';

type FundingSplitBarProps = {
  goalAmount: number;
  publicAmount: number;
  privateAmount: number;
  raisedLabel: string;
  governmentLabel: string;
  communityLabel: string;
  formatAmount: (value: number) => string;
  className?: string;
};

/**
 * The government/community funding split as a segmented progress bar — the
 * product's core visual, always both colored AND labeled (see
 * apps/dapp/DESIGN.md's Government/Community Split Rule). Used on project
 * cards, the project detail page, and the admin projects table.
 */
export function FundingSplitBar({
  goalAmount,
  publicAmount,
  privateAmount,
  raisedLabel,
  governmentLabel,
  communityLabel,
  formatAmount,
  className,
}: FundingSplitBarProps) {
  const raised = publicAmount + privateAmount;
  const publicPercent = goalAmount > 0 ? (publicAmount / goalAmount) * 100 : 0;
  const privatePercent =
    goalAmount > 0 ? (privateAmount / goalAmount) * 100 : 0;
  const raisedPercent = Math.min(publicPercent + privatePercent, 100);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">{raisedLabel}</span>
        <span className="font-display text-sm font-semibold tabular-nums text-foreground">
          {formatAmount(raised)}
          <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">
            / {formatAmount(goalAmount)} · {Math.round(raisedPercent)}%
          </span>
        </span>
      </div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${governmentLabel} ${Math.round(publicPercent)}%, ${communityLabel} ${Math.round(privatePercent)}%`}
      >
        <div
          className="h-full bg-public transition-[width] duration-700 ease-out"
          style={{ width: `${publicPercent}%` }}
        />
        <div
          className="h-full bg-private transition-[width] duration-700 ease-out"
          style={{ width: `${privatePercent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-public" aria-hidden="true" />
          {governmentLabel}
          <span className="tabular-nums text-muted-foreground">
            {formatAmount(publicAmount)}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-private" aria-hidden="true" />
          {communityLabel}
          <span className="tabular-nums text-muted-foreground">
            {formatAmount(privateAmount)}
          </span>
        </span>
      </div>
    </div>
  );
}
