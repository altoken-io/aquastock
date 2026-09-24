import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';

import FaqMenu from '@/components/FaqMenu';
import { dappPoolsUrl } from '@/lib/dapp-url';
import { PAGE_CONTAINER } from '@/modules/app/utils/layout';

const QUESTION_IDS = ['faq1', 'faq2', 'faq3', 'faq4', 'faq5', 'faq6'] as const;

export async function FaqSection() {
  const [t, locale] = await Promise.all([getTranslations('faq'), getLocale()]);
  const faqs = QUESTION_IDS.map((id) => ({
    question: t(`questions.${id}.question`),
    answer: t(`questions.${id}.answer`),
  }));

  return (
    <section id="faq" className="w-full py-20 sm:py-28">
      <div className={`${PAGE_CONTAINER} grid gap-10 lg:grid-cols-12 lg:gap-8`}>
        <div className="reveal lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <h2 className="text-4xl text-balance sm:text-6xl">{t('title')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
          <a
            href={dappPoolsUrl(locale)}
            className="group mt-8 inline-flex items-center gap-1.5 rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            {t('cta')}
            <ArrowUpRight
              aria-hidden
              className="size-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
            />
          </a>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <FaqMenu faqs={faqs} />
        </div>
      </div>
    </section>
  );
}
