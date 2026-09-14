'use client';

import { useRef } from 'react';
import { Menu, X } from 'lucide-react';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  type SheetActions,
} from '@aquastock/ui/tw/sheet';
import { Link } from '@/lib/i18n/navigation';
import type { NavItem } from './primary-nav';

export function MobileNav({
  navLinks,
  adminLabel,
  menuLabel,
  openLabel,
  closeLabel,
}: {
  navLinks: readonly NavItem[];
  adminLabel: string;
  menuLabel: string;
  openLabel: string;
  closeLabel: string;
}) {
  const actionsRef = useRef<SheetActions>(null);

  return (
    <Sheet actionsRef={actionsRef}>
      <SheetTrigger
        aria-label={openLabel}
        className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground md:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="gap-1 p-4">
        <div className="flex items-center justify-between pb-3">
          <SheetTitle>{menuLabel}</SheetTitle>
          <SheetClose
            aria-label={closeLabel}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </SheetClose>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Primary">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => actionsRef.current?.close()}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="mt-2 border-t border-border/70 pt-3">
          <Link
            href="/sign-in"
            onClick={() => actionsRef.current?.close()}
            className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
          >
            {adminLabel}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
