import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';

import { HeroSection } from '@/modules/app/components/sections/hero-section';
import { HowItWorksSection } from '@/modules/app/components/sections/how-it-works-section';
import { UseCasesSection } from '@/modules/app/components/sections/use-cases-section';
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

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <HeroSection />
      <HowItWorksSection />
      <UseCasesSection />
      <FaqSection />
      <EarlyAccessCtaSection />
    </div>
  );
}
