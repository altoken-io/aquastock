'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Link } from '@/lib/i18n/navigation';
import { requestPasswordReset } from '@/lib/auth/auth-client';

export function ForgotPasswordForm() {
  const t = useTranslations('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');

    await requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    });

    setIsSubmitting(false);
    // Always show success, regardless of whether the email exists — avoids
    // leaking which addresses have an admin account.
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-foreground/90">
          {t('forgotPassword.success')}
        </p>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('forgotPassword.backToSignIn')}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      className="flex w-full flex-col gap-4"
    >
      <Input
        placeholder=""
        label={t('forgotPassword.email')}
        name="email"
        type="email"
        required
        autoComplete="email"
        disabled={isSubmitting}
      />

      <Button
        type="submit"
        variant="solid"
        width="full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {t('forgotPassword.submit')}
      </Button>

      <Link
        href="/"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {t('forgotPassword.backToSignIn')}
      </Link>
    </form>
  );
}
