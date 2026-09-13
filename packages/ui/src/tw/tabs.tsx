'use client';

import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import type { ReactNode } from 'react';

import { cn } from '../utils/classNames';

/**
 * Thin styling wrapper around Base UI's Tabs primitive — handles roving
 * tabindex, arrow-key navigation, and ARIA wiring for us; this file only
 * owns how it looks.
 */
export const Tabs = BaseTabs.Root;

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <BaseTabs.List
      className={cn(
        'flex items-center gap-1 rounded-full border border-border bg-card p-1',
        className,
      )}
    >
      {children}
    </BaseTabs.List>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <BaseTabs.Tab
      value={value}
      className={cn(
        'flex-1 cursor-pointer rounded-full px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors',
        'hover:text-foreground',
        'data-active:bg-background data-active:text-foreground data-active:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {children}
    </BaseTabs.Tab>
  );
}

export function TabsPanel({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <BaseTabs.Panel
      value={value}
      className={cn('mt-6 focus-visible:outline-none', className)}
    >
      {children}
    </BaseTabs.Panel>
  );
}
