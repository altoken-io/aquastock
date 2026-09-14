import { ExternalLink } from 'lucide-react';

import { cn } from '@/utils/classNames';

/**
 * Stands in for a real Solana Explorer proof link once the Anchor program
 * exists (apps/dapp/PRODUCT.md: "every funded position ... should link to
 * its transaction/Explorer proof, not just display a number"). Every
 * txSignature in src/lib/demo/* is fake, so this renders inert — not a real
 * (and 404ing) devnet Explorer URL — with a title explaining why, rather
 * than implying a proof that doesn't exist yet.
 */
export function ExplorerLink({
  label,
  demoTitle,
  className,
}: {
  label: string;
  demoTitle: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-border/70 bg-secondary/50 px-2.5 py-1 text-xs font-medium text-muted-foreground',
        className,
      )}
      title={demoTitle}
      aria-disabled="true"
    >
      <ExternalLink className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
