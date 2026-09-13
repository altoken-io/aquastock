'use client';

import { createPortal } from 'react-dom';

const Portal = ({ children }: { children: React.ReactNode }) => {
  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) return null;
  return createPortal(children, portalTarget);
};

export default Portal;
