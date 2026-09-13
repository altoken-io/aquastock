import { getTranslations } from 'next-intl/server';

import {
  MotionDiv,
  MotionImg,
} from '@/components/helpers/motion/blur-lazy-motion';
import ButtonLink from '@/components/ui/button-link';
import { Avatar, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';

export async function HeroSection() {
  const t = await getTranslations('hero');

  return (
    <section
      id="home"
      className="relative flex items-center min-h-screen w-full overflow-hidden px-4 sm:px-20 lg:px-10 xl:px-20 2xl:px-36"
    >
      {/*<div className="relative flex  flex-col justify-center mx-10 md:mx-20 lg:mx-44 gap-16 lg:gap-8">*/}
      <div className="w-full justify-center">
        <h1 className="mb-8 text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl 2xl:text-7xl whitespace-pre-line">
          {t('title')}
          {/*{t.rich('title', {
          gradient: (chunks) => <span>{chunks}</span>,
          underline: (chunks) => <span>{chunks}</span>,
        })}*/}
        </h1>

        <MotionDiv className="mb-4 xl:max-w-prose font-light text-lg xl:text-xl text-foreground/90">
          {t('subtitle')}
        </MotionDiv>
        <MotionDiv
          delay={0.2}
          className="mb-6 xl:max-w-prose text-base xl:text-lg text-foreground/60"
        >
          {t('description')}
        </MotionDiv>
        <MotionDiv delay={0.4} className="flex w-full mb-5">
          <ButtonLink
            variant="primary"
            rounded="full"
            href={t('cta.primary.href')}
            className="h-12 font-medium"
          >
            <span>{t('cta.primary.label')}</span>
          </ButtonLink>
        </MotionDiv>
        <MotionDiv delay={0.6} className="flex gap-5 items-center">
          <AvatarGroup>
            <Avatar className="bg-accent-foreground/90" />
            <Avatar className="bg-secondary-foreground/80" />
            <Avatar className="bg-accent-foreground/70" />
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
          <span className="text-foreground/60">{t('usersCount')}</span>
        </MotionDiv>
        {/*</div>*/}
      </div>
      <div className="relative hidden h-screen items-center xl:flex">
        <MotionDiv
          animate={{
            scale: 1,
          }}
          initial={{
            scale: 0,
          }}
          transition={{ type: 'spring', visualDuration: 0.9, bounce: 0.2 }}
          className="bg-primary h-187 w-125 rounded-2xl"
        />
        <MotionImg
          animate={{
            scale: 1,
          }}
          initial={{
            scale: 0.5,
          }}
          transition={{ type: 'spring', visualDuration: 1, bounce: 0.2 }}
          src="/assets/brand/hero-1.jpg"
          alt="AquaStock wallet app showing a cross-border payment from Lima to Miami"
          width={500}
          height={800}
          className="absolute bottom-44 left-4 rounded-2xl"
        />
      </div>
    </section>
  );
}
