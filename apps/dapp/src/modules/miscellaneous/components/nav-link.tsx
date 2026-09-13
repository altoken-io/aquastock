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
              ? 'font-black text-primary'
              : 'font-normal transition hover:text-primary active:text-accent',
            'flex items-center gap-2',
            className,
          )}
          {...props}
        >
          <span className="relative text-medium group-hover:text-primary">
            {children}
            <div className="absolute bottom-0 left-0 h-0.5 w-2 bg-primary transition-all duration-300 group-hover:w-full" />
          </span>
        </Link>
        <div className="invisible absolute top-full right-0 flex translate-y-4 gap-6 overflow-hidden rounded-lg border border-primary/15 bg-neutral-200/95 p-4 opacity-0 backdrop-blur-md transition-all group-hover:visible group-hover:translate-y-2 group-hover:opacity-100 dark:border-primary/20 dark:bg-neutral-950/95 max-xl:p-2 max-xl:gap-4">
          {dropdown?.categories?.map(
            (category: AccountNavLinkCategory, idx) => (
              <div key={idx} className="flex flex-col gap-4">
                {category.title && (
                  <h3 className="text-lg max-xl:text-base font-medium text-primary">
                    {category.title}
                  </h3>
                )}
                <div className="flex min-w-48 flex-col gap-4">
                  {category.links.map((link: AccountNavLinkItem, linkIdx) => (
                    <Link
                      key={linkIdx}
                      href={link.href}
                      onClick={link.onClick}
                      className="flex w-full flex-col items-start gap-px rounded-none transition hover:text-primary active:text-accent"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-medium max-xl:text-sm">
                          {link.title}
                        </span>
                        <ChevronRight className="text-muted h-3 w-3" />
                      </div>
                      <p className="text-muted text-xs">{link.description}</p>
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
    <Link
      href={href}
      className={cn(
        isActive
          ? 'font-black text-primary'
          : 'font-normal transition hover:text-primary active:text-accent',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
};

export default NavLink;
