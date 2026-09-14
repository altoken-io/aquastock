import { Landmark, Users, type LucideIcon } from 'lucide-react';

import type { InvestorType } from '@aquastock/types';
import { cn } from '@/utils/classNames';

const STYLES: Record<InvestorType, { icon: LucideIcon; className: string }> = {
  PUBLIC: {
    icon: Landmark,
    className: 'border-public/30 bg-public/10 text-public',
  },
  PRIVATE: {
    icon: Users,
    className: 'border-private/30 bg-private/10 text-private',
  },
};

/**
 * Tags a position's investor_type with both color and an icon+label — never
 * color alone (apps/dapp/DESIGN.md's "Government/Community Split Rule").
 * Takes an already-translated `label` (via `t('investorType.PUBLIC')` from
 * the `project` namespace) rather than translating internally, so this stays
 * a plain presentational component usable from server or client parents.
 */
export function InvestorTypeBadge({
  investorType,
  label,
  className,
}: {
  investorType: InvestorType;
  label: string;
  className?: string;
}) {
  const { icon: Icon, className: styleClassName } = STYLES[investorType];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        styleClassName,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
