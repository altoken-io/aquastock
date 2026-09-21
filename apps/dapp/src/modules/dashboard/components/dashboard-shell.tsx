import type { ReactNode } from 'react';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { DashboardTopbar } from './dashboard-topbar';
import { Sidebar } from './sidebar';
import type { DashboardNavItem } from './sidebar-nav';

/**
 * The operator console shell — a dark-first "command center"
 * (see the chosen dashboard-theme direction), distinct from the light-first
 * investor-facing PublicShell. Forces `.dark` on its own subtree via a plain
 * class (not next-themes) so the console reads as dark regardless of the
 * visitor's site-wide theme preference — see MobileSidebar for why its
 * portaled Sheet content re-applies the same class.
 */
export async function DashboardShell({
  locale,
  userEmail,
  title,
  description,
  children,
}: {
  locale: Locale;
  userEmail: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'admin' });
  const navItems: DashboardNavItem[] = [
    { href: '/dashboard', label: t('sidebar.overview'), icon: 'overview' },
    { href: '/dashboard/pools', label: t('sidebar.pools'), icon: 'pools' },
  ];

  return (
    <div className="dark flex min-h-dvh w-full bg-background text-foreground">
      <Sidebar navItems={navItems} tagline={t('sidebar.tagline')} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          navItems={navItems}
          tagline={t('sidebar.tagline')}
          mobileOpenLabel={t('sidebar.mobileOpen')}
          mobileCloseLabel={t('sidebar.mobileClose')}
          title={title}
          description={description}
          signedInAsText={t('dashboard.signedInAs', { email: userEmail })}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
