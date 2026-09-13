'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks whether the page has scrolled past `threshold`, for scroll-aware
 * chrome like a fixed header that solidifies once content starts moving.
 */
export function useIsScrolled(threshold = 8) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > threshold);

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isScrolled;
}

export default useIsScrolled;
