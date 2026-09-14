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
import BrandLogo from '@/components/helpers/brand-logo';
import { SignOutButton } from '@/modules/auth/components/sign-out-button';
import { SidebarNav, type DashboardNavItem } from './sidebar-nav';

export function MobileSidebar({
  navItems,
  tagline,
  openLabel,
  closeLabel,
}: {
  navItems: readonly DashboardNavItem[];
  tagline: string;
  openLabel: string;
  closeLabel: string;
}) {
  const actionsRef = useRef<SheetActions>(null);

  return (
    <Sheet actionsRef={actionsRef}>
      <SheetTrigger
        aria-label={openLabel}
        className="flex size-9 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground lg:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="dark gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <BrandLogo alt="AquaStock" size={26} className="size-7" />
            <div>
              <SheetTitle>AquaStock</SheetTitle>
              <p className="text-xs text-sidebar-foreground/50">{tagline}</p>
            </div>
          </div>
          <SheetClose
            aria-label={closeLabel}
            className="rounded-full p-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </SheetClose>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <SidebarNav
            navItems={navItems}
            onNavigate={() => actionsRef.current?.close()}
          />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <SignOutButton className="w-full justify-start" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
