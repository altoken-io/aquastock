'use client';

import { cn } from '@/lib/utils';
import { ComponentProps, useState } from 'react';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Info, Mail, MessageCircle, Phone, Send, User } from 'lucide-react';
import SubmitButton from '@/components/helpers/submit-button';
import useClientFormSubmission from '@/hooks/use-client-form-submission';
import { submitContactForm } from '@/modules/miscellaneous/server/actions';
import {
  MotionInViewDiv,
  MotionInViewH1,
  MotionInViewH2,
  MotionInViewText,
} from '@/components/helpers/motion/blur-lazy-motion';

export type ContactFormProps = ComponentProps<'form'>;

const ContactForm = ({ className, ...props }: ContactFormProps) => {
  const [renderTime] = useState(() => Date.now());
  const {
    handleFormSubmit,
    status: { isLoading },
  } = useClientFormSubmission({
    action: submitContactForm,
  });
  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col gap-6 bg-linear-to-b from-green-50 to-white/50 px-4 pt-24 pb-36 dark:from-neutral-950 dark:to-green-950/50">
      <div className="mx-auto flex max-w-4xl grow flex-col justify-center gap-12">
        <div className="flex flex-col gap-2">
          <MotionInViewH1
            delay={0.2}
            className="flex w-fit items-center gap-2 rounded-full border border-emerald-300/75 bg-emerald-400/25 px-4 py-2 text-emerald-800 backdrop-blur-sm max-md:text-sm dark:text-emerald-200"
          >
            <Info className="size-4" />
            Contacto
          </MotionInViewH1>
          <MotionInViewH2
            delay={0.2}
            className="text-7xl font-bold max-md:text-5xl max-sm:text-4xl"
          >
            Hablemos
          </MotionInViewH2>
          <MotionInViewText
            delay={0.2}
            className="text-muted-foreground text-lg font-light max-sm:text-sm"
          >
            Evaluamos rápidamente tu caso y proponemos próximos pasos
          </MotionInViewText>
        </div>
        <form
          onSubmit={handleFormSubmit}
          className={cn(className, 'mx-auto flex w-full flex-col gap-8')}
          {...props}
        >
          <input name="blank" type="hidden" hidden aria-hidden />
          <input type="hidden" name="renderTime" value={renderTime} />
          <MotionInViewDiv delay={0.2} className="flex gap-2">
            <Input
              name="firstName"
              placeholder="Primer Nombre"
              disabled={isLoading}
              parentClassName="w-full"
              className="bg-transparent"
              icon={<User className="size-3" />}
              required
            />
            <Input
              name="lastName"
              placeholder="Segundo Nombre"
              disabled={isLoading}
              parentClassName="w-full"
              className="bg-transparent"
              required
            />
          </MotionInViewDiv>
          <MotionInViewDiv>
            <Input
              name="phone"
              type="tel"
              placeholder="Teléfono"
              disabled={isLoading}
              icon={<Phone className="size-3" />}
              className="bg-transparent"
              required
            />
          </MotionInViewDiv>
          <MotionInViewDiv delay={0.3}>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              disabled={isLoading}
              icon={<Mail className="size-3" />}
              className="bg-transparent"
              required
            />
          </MotionInViewDiv>
          <MotionInViewDiv delay={0.4}>
            <Textarea
              rows={5}
              name="message"
              placeholder="Mensaje"
              disabled={isLoading}
              className="bg-transparent"
              icon={<MessageCircle className="size-3" />}
              required
            />
          </MotionInViewDiv>
          <MotionInViewDiv
            delay={0.5}
            className="flex w-full items-start justify-between gap-4 max-sm:flex-col sm:items-center"
          >
            <p className="text-muted max-sm:text-sm">
              La información enviada no constituye asesoramiento ni una oferta
              de valores. Toda emisión o inversión está sujeta a verificación y
              al marco regulatorio aplicable.
            </p>
            <SubmitButton type="submit" variant="gradient" className="self-end">
              <Send className="size-4" />
              Enviar
            </SubmitButton>
          </MotionInViewDiv>
        </form>
      </div>
      <img
        alt="bg-contact-form"
        src="/assets/backgrounds/group-of-coins-c.webp"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-5 bg-blend-overlay"
      />
    </div>
  );
};

export default ContactForm;
