import type { ReactNode } from 'react';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import BrandLogo from '@/components/helpers/brand-logo';
import { Link } from '@/lib/i18n/navigation';
import { getDemoTotals } from '@/lib/demo/projects';
import { ConfluenceRing } from '@/modules/product/components/confluence-ring';

/**
 * Split-panel layout for the staff/government admin console
 * (sign-in/forgot-password/reset-password) — distinct from the investor-
 * facing PublicShell on purpose: this audience is signing in to verify
 * milestones, not browsing projects. See memory: better-auth-scope.
 */
export async function AuthShell({
  locale,
  title,
  subtitle,
  children,
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'admin' });
  const tLegal = await getTranslations({ locale, namespace: 'legal' });
  const totals = getDemoTotals();

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandLogo
            alt="AquaStock"
            size={28}
            className="size-7 text-background"
          />
          <span className="text-sm font-semibold tracking-[0.14em] uppercase">
            AquaStock
          </span>
        </Link>

        <div className="flex flex-col items-start gap-6">
          <ConfluenceRing
            publicValue={totals.totalPublic}
            privateValue={totals.totalPrivate}
            size={200}
            strokeWidth={16}
            label={t('console.ringLabel')}
          />
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-background/60 uppercase">
              {t('console.eyebrow')}
            </p>
            <h2 className="mt-2 text-2xl font-medium text-balance">
              {t('console.title')}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-background/70">
              {t('console.description')}
            </p>
          </div>
        </div>

        <p className="text-xs text-background/50">{tLegal('disclaimer')}</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <BrandLogo alt="AquaStock" size={28} className="size-7" />
            <span className="text-sm font-semibold tracking-[0.14em] text-foreground uppercase">
              AquaStock
            </span>
          </Link>

          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl text-foreground">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
