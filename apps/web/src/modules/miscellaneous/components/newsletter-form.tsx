'use client';

import SubmitButton from '@/components/helpers/submit-button';
import Input from '@/components/ui/input';
import useClientFormSubmission from '@/hooks/use-client-form-submission';
import { submitNewsletterForm } from '@/modules/miscellaneous/server/actions';
import { Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ComponentProps, useState } from 'react';
import { toast } from 'sonner';

export type NewsletterFormProps = ComponentProps<'form'>;

const NewsletterForm = ({ ...props }: NewsletterFormProps) => {
  const [renderTime] = useState(() => Date.now());

  const t = useTranslations('newsletter');

  const {
    handleFormSubmit,
    status: { isSubmitting },
  } = useClientFormSubmission({
    action: submitNewsletterForm,
    onSuccess: ({ message }) => {
      toast.success(message);
    },
    onError: ({ message }) => {
      toast.error(message);
    },
  });
  return (
    <form
      onSubmit={handleFormSubmit}
      className="flex w-full items-center gap-2"
      {...props}
    >
      <input name="blank" type="hidden" hidden />
      <input name="renderTime" type="hidden" hidden value={renderTime} />
      <Input
        name="email"
        type="email"
        autoFocus
        icon={<Mail className="size-3" />}
        disabled={isSubmitting}
        placeholder={t('form.placeholders.email')}
        parentClassName="w-full max-w-sm"
        className="w-full rounded-full border border-emerald-300/75 bg-transparent dark:border-emerald-700/75"
      />
      <SubmitButton
        isSubmitting={isSubmitting}
        type="submit"
        loaderText={t('form.cta.submit')}
        variant="primary"
        rounded="full"
      >
        {t('form.cta.submit')}
      </SubmitButton>
    </form>
  );
};

export default NewsletterForm;
