'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { resetPassword } from '@/lib/auth/auth-client';

export function ResetPasswordForm() {
  const t = useTranslations('admin');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p role="alert" className="text-sm text-red-500">
          {t('resetPassword.invalidToken')}
        </p>
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('forgotPassword.backToSignIn')}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get('newPassword') ?? '');

    const { error: resetError } = await resetPassword({ newPassword, token });

    setIsSubmitting(false);

    if (resetError) {
      setError(t('resetPassword.invalidToken'));
      return;
    }

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-foreground/90">
          {t('resetPassword.success')}
        </p>
        <Button
          variant="solid"
          width="full"
          onClick={() => router.push('/sign-in')}
        >
          {t('resetPassword.backToSignIn')}
        </Button>
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
        label={t('resetPassword.newPassword')}
        name="newPassword"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        disabled={isSubmitting}
      />

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="solid"
        width="full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {t('resetPassword.submit')}
      </Button>
    </form>
  );
}
