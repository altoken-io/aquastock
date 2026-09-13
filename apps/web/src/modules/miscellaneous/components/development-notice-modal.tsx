'use client';

import { useCallback, useState } from 'react';

import { X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';

import { MotionDiv } from '@/components/helpers/motion/blur-lazy-motion';
import Button from '@/components/ui/my-button';
import ButtonLink from '@/components/ui/button-link';
import Portal from '@/components/ui/portal';

const DevelopmentNoticeModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const t = useTranslations('importantNotice');

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            delay={0.8}
            exit={{ opacity: 0, transition: { delay: 0.2 } }}
            className="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 px-4"
          >
            <div className="flex flex-col gap-4 relative w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-8 max-sm:p-4 text-neutral-900 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50">
              <button
                type="button"
                aria-label="Close Important Notice"
                className="absolute right-4 top-4 rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                onClick={handleClose}
              >
                <X className="size-4" />
              </button>
              <p className="tagline">{t('hero.tagline')}</p>
              <h2 className="text-2xl font-medium">{t('hero.title')}</h2>
              <p className="description text-base max-sm:text-sm">
                {t('hero.description')}
              </p>
              <div className="mt-6 flex gap-6 w-full">
                <Button
                  type="button"
                  variant="gradient"
                  onClick={handleClose}
                  className="w-1/2"
                >
                  {t('cta.primary.label')}
                </Button>
                <ButtonLink href={t('cta.secondary.href')} className="w-1/2">
                  {t('cta.secondary.label')}
                </ButtonLink>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export default DevelopmentNoticeModal;
