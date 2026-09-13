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
      <body className={`relative antialiased ${_geist.className}`}>
        <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16 text-black">
          <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-black/60">
              WORK IN PROGRESS
            </p>
            <h1 className="text-5xl font-light uppercase md:text-6xl">
              Fresh Concrete, Wet Paint
            </h1>
            <p className="text-base text-black/70 md:text-lg">
              This section is still under construction. We are shaping the final
              experience and it will be live soon.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/en"
                className="rounded-full border border-black/20 px-5 py-2 text-sm hover:bg-black/5"
              >
                Back to Home
              </Link>
              <Link
                href="mailto:admin@aquastock.io"
                className="rounded-full border border-black/20 px-5 py-2 text-sm hover:bg-black/5"
              >
                Talk to Us
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
