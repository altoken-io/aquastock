'use client';

import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectOption,
  SelectTrigger,
} from '@/components/ui/animated/select';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';

export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <div className={cn('relative', className)}>
      <Select>
        <SelectTrigger
          aria-label="Language"
          className="group flex size-9 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-background/60 text-foreground/70 transition-colors duration-200 ease-out hover:bg-accent hover:text-foreground"
        >
          <Globe className="size-4" />
        </SelectTrigger>
        <SelectContent>
          <SelectOption value="es">
            <Link locale="es" href={pathname}>
              <span>Español</span>
            </Link>
          </SelectOption>
          <SelectOption value="en">
            <Link locale="en" href={pathname}>
              <span>English</span>
            </Link>
          </SelectOption>
        </SelectContent>
      </Select>
    </div>
  );
}
