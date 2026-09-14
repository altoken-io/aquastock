import { LanguageSwitcher } from '@/components/helpers/language-switcher';
import { MobileSidebar } from './mobile-sidebar';
import type { DashboardNavItem } from './sidebar-nav';

export function DashboardTopbar({
  navItems,
  tagline,
  mobileOpenLabel,
  mobileCloseLabel,
  title,
  description,
  signedInAsText,
}: {
  navItems: readonly DashboardNavItem[];
  tagline: string;
  mobileOpenLabel: string;
  mobileCloseLabel: string;
  title: string;
  description?: string;
  signedInAsText: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/85 bg-background/90 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <MobileSidebar
          navItems={navItems}
          tagline={tagline}
          openLabel={mobileOpenLabel}
          closeLabel={mobileCloseLabel}
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-medium text-foreground">
            {title}
          </h1>
          {description && (
            <p className="truncate text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <span className="hidden max-w-52 truncate rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
          {signedInAsText}
        </span>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
