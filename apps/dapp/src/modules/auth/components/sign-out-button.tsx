'use client';

import { useTranslations } from 'next-intl';

import Button from '@/components/ui/button';
import { useRouter } from '@/lib/i18n/navigation';
import { signOut } from '@/lib/auth/auth-client';

export function SignOutButton() {
  const t = useTranslations('admin');
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
    router.refresh();
  };

  return (
    <Button variant="transparent" onClick={handleSignOut}>
      {t('dashboard.signOut')}
    </Button>
  );
}
