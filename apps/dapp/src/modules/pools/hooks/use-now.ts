'use client';

import { useEffect, useState } from 'react';

/**
 * Unix seconds that tick. It starts from a value the server rendered, so the first client
 * render matches the HTML exactly, and only then begins to advance.
 */
export function useNow(initial: number, intervalMs = 1_000): number {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    const tick = (): void => setNow(Math.floor(Date.now() / 1_000));
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
