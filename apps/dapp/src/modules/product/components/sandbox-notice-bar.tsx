'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

import { MotionDiv } from '@/components/helpers/motion/blur-lazy-motion';
import ButtonLink from '@/components/ui/button-link';
import { WEB_BASE_URL } from '@/lib/web-url';
import { cn } from '@/utils/classNames';

const DISMISS_KEY = 'aquastock_dapp_demo_notice_dismissed';

/**
 * A slim, dismissible "this is a hackathon demo" strip — fulfills
 * apps/dapp/PRODUCT.md's "no false certainty" / anti-references rule that
 * the devnet-demo framing stays visible, using the already-scaffolded
 * `importantNotice` namespace copy (previously unused anywhere). Separate
 * from CookieBanner's bottom-corner card so the two never stack.
 */
export function SandboxNoticeBar({ className }: { className?: string }) {
  const t = useTranslations('importantNotice');
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Ignore storage errors — worst case, the banner reappears next visit.
    }
  };

  return (
    <AnimatePresence initial={false}>
      {!dismissed && (
        <MotionDiv
          className={cn(
            'w-full border-b border-border/85 bg-accent/60 text-accent-foreground',
            className,
          )}
        >
          <div className="container flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-xs sm:text-sm">
            <span className="font-medium">{t('hero.title')}.</span>
            <span className="text-accent-foreground/80">
              {t('hero.description')}
            </span>
            <ButtonLink
              href={WEB_BASE_URL}
              variant="linkText"
              className="font-medium text-primary hover:text-primary/80"
            >
              {t('cta.secondary.label')}
            </ButtonLink>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={t('cta.primary.label')}
              className="ml-1 rounded-full p-1 text-accent-foreground/70 transition-colors hover:bg-accent-foreground/10 hover:text-accent-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}
