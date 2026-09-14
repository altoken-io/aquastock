import { Waves } from 'lucide-react';

import { cn } from '@/utils/classNames';

const RATIO_CLASS = {
  card: 'aspect-[4/3]',
  hero: 'aspect-[21/9]',
} as const;

// Low-opacity brand-token washes — no new hex, just color-mix() over the
// existing --public/--primary/--private tokens (same technique globals.css
// already uses for its shadow-*-raw variables).
const GRADIENT_VARIANTS = [
  'linear-gradient(135deg, color-mix(in srgb, var(--public) 22%, transparent) 0%, color-mix(in srgb, var(--primary) 18%, transparent) 55%, color-mix(in srgb, var(--private) 22%, transparent) 100%)',
  'linear-gradient(150deg, color-mix(in srgb, var(--private) 22%, transparent) 0%, color-mix(in srgb, var(--primary) 18%, transparent) 50%, color-mix(in srgb, var(--public) 22%, transparent) 100%)',
  'linear-gradient(115deg, color-mix(in srgb, var(--primary) 20%, transparent) 0%, color-mix(in srgb, var(--public) 18%, transparent) 45%, color-mix(in srgb, var(--private) 20%, transparent) 100%)',
];

function seedIndex(seed: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return Math.abs(hash) % modulo;
}

/**
 * Stand-in for real project photography — an abstract, on-brand wash rather
 * than a plain gray box, so the demo still screenshots well. Every place
 * this is used is documented with its exact ratio/dimensions in
 * apps/dapp/PLACEHOLDER_ASSETS.md so real photography can replace it later.
 * Purely decorative (the project name/location render as real text
 * alongside it), so this is aria-hidden rather than carrying alt text.
 */
export function ProjectImagePlaceholder({
  seed,
  ratio = 'card',
  className,
}: {
  seed: string;
  ratio?: keyof typeof RATIO_CLASS;
  className?: string;
}) {
  const gradient = GRADIENT_VARIANTS[seedIndex(seed, GRADIENT_VARIANTS.length)];

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative w-full overflow-hidden rounded-2xl bg-muted',
        RATIO_CLASS[ratio],
        className,
      )}
    >
      <div className="absolute inset-0" style={{ backgroundImage: gradient }} />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
      >
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M -40 ${230 - i * 45} Q 120 ${170 - i * 45}, 200 ${230 - i * 45} T 440 ${230 - i * 45}`}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth={1.5}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Waves className="size-8 text-foreground/25" strokeWidth={1.5} />
      </div>
    </div>
  );
}
