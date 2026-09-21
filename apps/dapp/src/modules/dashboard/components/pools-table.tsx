import type { PoolDto } from '@aquastock/types';

import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';
import { PhaseBadge } from '@/modules/pools/components/pool-badges';
import { poolPhase } from '@/modules/pools/lib/pool-status';

/** Every pool as one row: what it is, where it stands, and how much is locked in it. */
export function PoolsTable({
  pools,
  now,
  label,
  columnLabels,
  displayName,
  formatAmount,
  formatDate,
  className,
}: {
  pools: readonly PoolDto[];
  now: number;
  /** Names the scrollable region. */
  label: string;
  columnLabels: {
    pool: string;
    status: string;
    budget: string;
    reserved: string;
    closes: string;
  };
  displayName: (pool: PoolDto) => string;
  formatAmount: (raw: string) => string;
  formatDate: (unixSeconds: number) => string;
  className?: string;
}) {
  return (
    // A scroll region must be reachable and named for keyboard and screen-reader users.
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        'overflow-x-auto rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="pr-4 pb-3 font-medium">{columnLabels.pool}</th>
            <th className="pr-4 pb-3 font-medium">{columnLabels.status}</th>
            <th className="pr-4 pb-3 text-right font-medium">
              {columnLabels.budget}
            </th>
            <th className="pr-4 pb-3 text-right font-medium">
              {columnLabels.reserved}
            </th>
            <th className="pb-3 font-medium">{columnLabels.closes}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {pools.map((pool) => (
            <tr key={pool.address}>
              <td className="py-3 pr-4">
                <Link
                  href={`/pools/${pool.address}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {displayName(pool)}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <PhaseBadge phase={poolPhase(pool, now)} />
              </td>
              <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">
                {formatAmount(pool.budgetTotal)}
              </td>
              <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">
                {formatAmount(pool.reserved)}
              </td>
              <td className="py-3 whitespace-nowrap text-muted-foreground">
                {formatDate(pool.endsAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
