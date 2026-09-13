'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/** Polls /api/version and prompts a reload once the deployed build changes
 * underneath an open tab. Never reloads automatically — this is a wallet
 * app, and an unprompted reload mid-flow (e.g. mid-send) would be worse
 * than a stale tab. */
export function UpdateChecker() {
  const t = useTranslations('common.update');

  useEffect(() => {
    let cancelled = false;
    let baseline: string | null = null;
    let notified = false;

    const checkVersion = async () => {
      if (notified || cancelled) return;
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { buildId } = (await res.json()) as { buildId: string };

        if (baseline === null) {
          baseline = buildId;
          return;
        }

        if (buildId !== baseline) {
          notified = true;
          toast(t('title'), {
            id: 'app-update-available',
            description: t('description'),
            duration: Infinity,
            action: {
              label: t('reload'),
              onClick: () => window.location.reload(),
            },
            cancel: { label: t('later'), onClick: () => {} },
          });
        }
      } catch {
        // Transient network errors shouldn't nag the user — just retry next tick.
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkVersion();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [t]);

  return null;
}
