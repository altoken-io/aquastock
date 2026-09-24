import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';

import { IntroCurtain } from '@/modules/app/components/intro-curtain';
import { HeroSection } from '@/modules/app/components/sections/hero-section';
import { SidesMarqueeSection } from '@/modules/app/components/sections/sides-marquee-section';
import { HowItWorksSection } from '@/modules/app/components/sections/how-it-works-section';
import { LeavingEarlySection } from '@/modules/app/components/sections/leaving-early-section';
import { WorldSection } from '@/modules/app/components/sections/world-section';
import { FaqSection } from '@/modules/app/components/sections/faq-section';
import { EarlyAccessCtaSection } from '@/modules/app/components/sections/early-access-cta-section';
import { routing } from '@/lib/i18n/routing';

type HomePageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for Server Components rendered by this page.
  setRequestLocale(locale);
  const t = await getTranslations('hero');

  // The page reads downstream: the two rivers meet (hero), who they are (marquee), how they
  // join (steps), what leaving early costs (outcomes), how far they reach (globe), the hard
  // questions, then the way in.
  return (
    <div className="flex w-full flex-col">
      <IntroCurtain label={t('intro.label')} />
      <HeroSection />
      <SidesMarqueeSection />
      <HowItWorksSection />
      <LeavingEarlySection />
      <WorldSection />
      <FaqSection />
      <EarlyAccessCtaSection />
    </div>
  );
}
