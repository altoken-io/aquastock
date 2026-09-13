'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';

import { MotionDiv } from '@/components/helpers/motion/blur-lazy-motion';
import Portal from '@/components/ui/portal';
import Button from '@/components/ui/button';
import ButtonLink from '@/components/ui/button-link';

const CONSENT_STORAGE_KEY = 'aquastock_cookie_consent';
const CONSENT_COOKIE_KEY = 'aquastock_cookie_consent';
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type ConsentState = 'accepted' | 'declined';

const getCookieValue = (key: string) => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';').map((entry) => entry.trim());
  const match = cookies.find((entry) => entry.startsWith(`${key}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(key.length + 1));
};

const readConsent = (): ConsentState | null => {
  if (typeof window === 'undefined') return null;
  const cookieValue = getCookieValue(CONSENT_COOKIE_KEY);
  if (cookieValue === 'accepted' || cookieValue === 'declined') {
    return cookieValue;
  }

  try {
    const storedValue = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (storedValue === 'accepted' || storedValue === 'declined') {
      return storedValue;
    }
  } catch {
    return null;
  }

  return null;
};

const persistConsent = (value: ConsentState) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Ignore storage errors to avoid blocking consent flow.
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE_KEY}=${encodeURIComponent(
    value,
  )}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
};

const CookieBanner = () => {
  const t = useTranslations('cookies');
  const [visible, setVisible] = useState(false);

  const bannerContent = useMemo(
    () => ({
      tagline: t('banner.tagline'),
      title: t('banner.title'),
      description: t('banner.description'),
      accept: t('banner.accept'),
      decline: t('banner.decline'),
      linkLabel: t('banner.link.label'),
      linkHref: t('banner.link.href'),
    }),
    [t],
  );

  useEffect(() => {
    const consent = readConsent();
    if (consent) return;
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleChoice = (value: ConsentState) => {
    persistConsent(value);
    setVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent', { detail: value }));
  };

  return (
    <Portal>
      <AnimatePresence>
        {visible && (
          <MotionDiv
            delay={0.15}
            className="fixed inset-x-0 bottom-0 z-70 flex justify-center px-4 pb-4 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:block sm:px-0 sm:pb-0"
          >
            <div
              role="region"
              aria-label={bannerContent.title}
              className="dapp-panel-accent w-full max-w-md overflow-hidden"
            >
              <div className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="dapp-icon-accent shrink-0">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs font-medium tracking-[0.14em] text-primary/80 uppercase">
                      {bannerContent.tagline}
                    </p>
                    <h2 className="text-base font-semibold text-foreground sm:text-lg">
                      {bannerContent.title}
                    </h2>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {bannerContent.description}{' '}
                  <ButtonLink
                    href={bannerContent.linkHref}
                    variant="linkText"
                    className="text-primary hover:text-primary/80"
                  >
                    {bannerContent.linkLabel}
                  </ButtonLink>
                </p>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    variant="solid"
                    rounded="full"
                    padding="md"
                    shadow="none"
                    animation="grow"
                    onClick={() => handleChoice('accepted')}
                  >
                    {bannerContent.accept}
                  </Button>
                  <Button
                    variant="transparent"
                    rounded="full"
                    padding="md"
                    shadow="none"
                    onClick={() => handleChoice('declined')}
                  >
                    {bannerContent.decline}
                  </Button>
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default CookieBanner;
