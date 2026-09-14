import BrandLogo from '@/components/helpers/brand-logo';
import { SignOutButton } from '@/modules/auth/components/sign-out-button';
import { SidebarNav, type DashboardNavItem } from './sidebar-nav';

export function Sidebar({
  navItems,
  tagline,
}: {
  navItems: readonly DashboardNavItem[];
  tagline: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <BrandLogo alt="AquaStock" size={26} className="size-7" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-[0.1em] uppercase">
            AquaStock
          </p>
          <p className="truncate text-xs text-sidebar-foreground/50">
            {tagline}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <SidebarNav navItems={navItems} />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <SignOutButton className="w-full justify-start" />
      </div>
    </aside>
  );
}
