'use client';

import { useTranslations } from 'next-intl';

import Button from '@/components/ui/button';
import { useRouter } from '@/lib/i18n/navigation';
import { signOut } from '@/lib/auth/auth-client';

export function SignOutButton({ className }: { className?: string }) {
  const t = useTranslations('admin');
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <Button variant="transparent" onClick={handleSignOut} className={className}>
      {t('dashboard.signOut')}
    </Button>
  );
}
