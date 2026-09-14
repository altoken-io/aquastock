import { setRequestLocale, getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';

import { HeroSection } from '@/modules/app/components/sections/hero-section';
import { ConfluenceSection } from '@/modules/app/components/sections/confluence-section';
import { HowItWorksSection } from '@/modules/app/components/sections/how-it-works-section';
import { UseCasesSection } from '@/modules/app/components/sections/use-cases-section';
import { FaqSection } from '@/modules/app/components/sections/faq-section';
import { EarlyAccessCtaSection } from '@/modules/app/components/sections/early-access-cta-section';
import { GaugeRail } from '@/modules/app/components/gauge-rail';
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

  const [tHero, tConfluence, tHowItWorks, tUseCases, tFaq, tEarlyAccess] =
    await Promise.all([
      getTranslations('hero'),
      getTranslations('confluence'),
      getTranslations('howItWorks'),
      getTranslations('useCases'),
      getTranslations('faq'),
      getTranslations('earlyAccessCta'),
    ]);

  const gaugeData = [
    { id: 'home', label: tHero('gaugeLabel') },
    { id: 'confluence', label: tConfluence('gaugeLabel') },
    { id: 'how-it-works', label: tHowItWorks('gaugeLabel') },
    { id: 'use-cases', label: tUseCases('gaugeLabel') },
    { id: 'faq', label: tFaq('gaugeLabel') },
    { id: 'early-access', label: tEarlyAccess('gaugeLabel') },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <GaugeRail data={gaugeData} />
      <HeroSection />
      <ConfluenceSection />
      <HowItWorksSection />
      <UseCasesSection />
      <FaqSection />
      <EarlyAccessCtaSection />
    </div>
  );
}
