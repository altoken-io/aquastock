'use client';

import { Link, usePathname } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';

export type NavItem = { href: string; title: string };

/** Desktop pill nav with active-state highlighting — a client leaf so only this needs usePathname. */
export function PrimaryNav({
  navLinks,
  className,
}: {
  navLinks: readonly NavItem[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn('hidden items-center gap-1 md:flex', className)}
    >
      {navLinks.map((item) => {
        const isActive =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
