'use client';

import { ClipboardCheck, FolderKanban, LayoutDashboard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Link, usePathname } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';

export type DashboardNavIcon = 'command' | 'projects' | 'milestones';
export type DashboardNavItem = {
  href: string;
  label: string;
  icon: DashboardNavIcon;
  count?: number;
};

const ICONS: Record<DashboardNavIcon, LucideIcon> = {
  command: LayoutDashboard,
  projects: FolderKanban,
  milestones: ClipboardCheck,
};

export function SidebarNav({
  navItems,
  onNavigate,
  className,
}: {
  navItems: readonly DashboardNavItem[];
  /** Fired on click — used by the mobile drawer to close itself. */
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard"
      className={cn('flex flex-col gap-1', className)}
    >
      {navItems.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);
        const Icon = ICONS[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
            {typeof item.count === 'number' && item.count > 0 && (
              <span
                className={cn(
                  'ml-auto rounded-full px-2 py-0.5 text-xs tabular-nums',
                  isActive
                    ? 'bg-sidebar-primary/20 text-sidebar-primary'
                    : 'bg-sidebar-foreground/10 text-sidebar-foreground/60',
                )}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
