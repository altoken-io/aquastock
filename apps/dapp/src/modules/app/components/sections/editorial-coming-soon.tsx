import { getTranslations } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';

type EditorialComingSoonProps = {
  locale: (typeof routing.locales)[number];
};

export default async function EditorialComingSoon({
  locale,
}: EditorialComingSoonProps) {
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#f5f1e8] px-6 py-16 text-[#111111]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(17,17,17,0.08),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(17,17,17,0.06),transparent_45%)]" />

      <section className="relative mx-auto flex w-full max-w-3xl flex-col items-start gap-8 border border-black/20 bg-white/70 p-8 backdrop-blur-sm md:p-12">
        <p className="text-xs uppercase tracking-[0.24em] text-black/70">
          {t('underConstruction.appLabel')}
        </p>

        <div className="space-y-4">
          <h1
            className="text-5xl leading-none font-light uppercase md:text-7xl"
            style={{
              fontFamily:
                'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            }}
          >
            {t('underConstruction.title')}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-black/75 md:text-lg">
            {t('underConstruction.description')}
          </p>
        </div>

        <div className="h-px w-full bg-black/20" />
        <p className="text-sm uppercase tracking-[0.2em] text-black/60">
          {t('underConstruction.thanks')}
        </p>
      </section>
    </main>
  );
}
