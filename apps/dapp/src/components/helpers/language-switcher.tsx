'use client';

import { Globe } from 'lucide-react';
import {
  MenuLinkItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
} from '@aquastock/ui/tw/menu';
import { Tooltip } from '@aquastock/ui/tw/tooltip';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';

const LOCALES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <MenuRoot>
      <Tooltip content="Language">
        <MenuTrigger
          aria-label="Language"
          className={cn(
            'group flex items-center justify-center rounded-full border border-border/70 bg-card/80 p-2 text-muted-foreground transition-colors ease-in-out hover:border-primary/20 hover:bg-primary/10 hover:text-foreground active:bg-secondary',
            className,
          )}
        >
          <Globe className="size-4 opacity-60 transition-opacity ease-in-out group-hover:opacity-100" />
        </MenuTrigger>
      </Tooltip>
      <MenuPortal>
        <MenuPositioner align="end">
          <MenuPopup className="border-border bg-card">
            {LOCALES.map(({ code, label }) => (
              <MenuLinkItem
                key={code}
                className="text-foreground data-highlighted:bg-secondary/70"
                render={<Link locale={code} href={pathname} />}
              >
                {label}
              </MenuLinkItem>
            ))}
          </MenuPopup>
        </MenuPositioner>
      </MenuPortal>
    </MenuRoot>
  );
}
