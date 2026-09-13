import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist } from 'next/font/google';

import './globals.css';

const _geist = Geist({ subsets: ['latin'] });

export function generateMetadata(): Metadata {
  return {
    title: 'Under Construction | AquaStock',
    description: 'This section is being built right now. Check back soon.',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`relative bg-white text-neutral-900 antialiased ${_geist.className}`}
      >
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Page not found
            </p>
            <h1 className="text-5xl font-light md:text-6xl">
              This page isn&apos;t live yet
            </h1>
            <p className="text-base text-neutral-500 md:text-lg">
              AquaStock is a work-in-progress hackathon build — this section
              hasn&apos;t shipped yet.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/en"
                className="rounded-full border border-neutral-300 px-5 py-2 text-sm hover:bg-neutral-100"
              >
                Back to home
              </Link>
              <Link
                href="mailto:admin@aquastock.io"
                className="rounded-full border border-neutral-300 px-5 py-2 text-sm hover:bg-neutral-100"
              >
                Talk to us
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
