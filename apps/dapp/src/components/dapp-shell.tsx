'use client';

import Image from 'next/image';

import { LanguageSwitcher } from '@/components/helpers/language-switcher';
import ThemeSwitcher from '@/components/helpers/theme-switcher';
import { Link } from '@/lib/i18n/navigation';

// Minimal placeholder shell. The real navigation (Home, Project, Milestones,
// My Impact) and wallet-connect state land with the Day 1-3 UI work per the
// AquaStock build plan — this just keeps the app buildable in the meantime.
export function DappShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground font-sans">
      <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-border/85 bg-background/92 px-4 py-4 backdrop-blur-md sm:px-6 md:px-8 lg:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/assets/favicon/android-chrome-512x512.png"
            alt="AquaStock"
            width={34}
            height={34}
            className="rounded-xl object-contain"
          />
          <span className="truncate text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
            AquaStock
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 md:px-10">
        {children}
      </main>
    </div>
  );
}
