'use client';

import { HTMLAttributes } from 'react';

import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';

type AccountNavLinkItem = {
  href: string;
  title: string;
  description?: string;
  onClick?: () => void;
};

type AccountNavLinkCategory = {
  title?: string;
  links: AccountNavLinkItem[];
};

const NavLink = ({
  href,
  children,
  className,
  dropdown,
  ...props
}: HTMLAttributes<HTMLAnchorElement> & {
  href: string;
  dropdown?: {
    categories: AccountNavLinkCategory[];
  };
}) => {
  const pathname = usePathname();

  const isActive = pathname === href && pathname.length !== 1;

  if (dropdown) {
    return (
      <div className="group relative flex flex-col">
        <Link
          href={href}
          className={cn(
            isActive
              ? 'font-semibold text-red-800 dark:text-red-400'
              : 'font-normal text-stone-700 transition hover:text-red-800 active:text-red-900 dark:text-neutral-300 dark:hover:text-red-400 dark:active:text-red-500',
            'flex items-center gap-2',
            className,
          )}
          {...props}
        >
          <span className="relative text-sm font-medium tracking-[0.18em]">
            {children}
            <div className="absolute -bottom-1 left-0 h-px w-0 bg-red-800 transition-all duration-300 group-hover:w-full dark:bg-red-400" />
          </span>
        </Link>
        <div className="invisible absolute top-full right-0 mt-4 flex min-w-[30rem] translate-y-4 gap-6 overflow-hidden rounded-[1.75rem] border border-red-900/10 bg-white/92 p-5 opacity-0 shadow-[0_24px_80px_-32px_rgba(28,25,23,0.28)] backdrop-blur-2xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-white/10 dark:bg-neutral-950/92 dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.75)] max-xl:min-w-[26rem] max-xl:gap-4 max-xl:p-4">
          {dropdown?.categories?.map(
            (category: AccountNavLinkCategory, idx) => (
              <div key={idx} className="flex flex-col gap-4">
                {category.title && (
                  <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-red-800/80 dark:text-red-400/80">
                    {category.title}
                  </h3>
                )}
                <div className="flex min-w-48 flex-col gap-4">
                  {category.links.map((link: AccountNavLinkItem, linkIdx) => (
                    <Link
                      key={linkIdx}
                      href={link.href}
                      onClick={link.onClick}
                      className="flex w-full flex-col items-start gap-1 rounded-2xl border border-transparent px-3 py-3 transition hover:border-red-900/10 hover:bg-red-50/70 hover:text-red-800 active:text-red-900 dark:hover:border-white/10 dark:hover:bg-white/5 dark:hover:text-red-400"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-semibold">
                          {link.title}
                        </span>
                        <ChevronRight className="h-3 w-3 text-stone-400 dark:text-neutral-500" />
                      </div>
                      <p className="text-xs text-stone-500 dark:text-neutral-400">
                        {link.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col">
      <Link
        href={href}
        className={cn(
          isActive
            ? 'font-semibold text-primary'
            : 'text-foreground transition hover:text-primary active:text-primary',
          'flex items-center gap-2',
          className,
        )}
        {...props}
      >
        <span>
          {children}
          <div className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-700 group-hover:w-full" />
        </span>
      </Link>
    </div>
  );
};

export default NavLink;
