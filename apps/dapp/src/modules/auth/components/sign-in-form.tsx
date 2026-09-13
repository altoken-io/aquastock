'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { signIn } from '@/lib/auth/auth-client';

export function SignInForm() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    const { error: signInError } = await signIn.email({ email, password });

    setIsSubmitting(false);

    if (signInError) {
      setError(t('signIn.error'));
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      className="flex w-full flex-col gap-4"
    >
      <Input
        label={t('signIn.email')}
        name="email"
        type="email"
        required
        autoComplete="email"
        disabled={isSubmitting}
      />
      <Input
        label={t('signIn.password')}
        name="password"
        type="password"
        required
        autoComplete="current-password"
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
        {t('signIn.submit')}
      </Button>

      <Link
        href="/forgot-password"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {t('signIn.forgotPassword')}
      </Link>
    </form>
  );
}
