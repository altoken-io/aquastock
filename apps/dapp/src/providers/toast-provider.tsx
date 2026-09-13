import type { ReactNode } from 'react';

import { Toaster } from 'sonner';

export const ToasterProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {children}
      <Toaster position="top-center" duration={2000} richColors />
    </>
  );
};
