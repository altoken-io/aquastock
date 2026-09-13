'use client';

import { useEffect, useEffectEvent, useState } from 'react';

/**
 * useEffectMount
 * - Returns `true` after the component mounts on the client, otherwise `false`.
 * - Optionally runs `onMount` once after mount and respects its cleanup on unmount.
 *
 * Notes
 * - We intentionally run only once (empty deps). If you need to react to changes,
 *   use a separate effect in your component.
 */
type MountCallback = () => void | (() => void);

const useEffectMount = (onMount?: MountCallback) => {
  const [mounted, setMounted] = useState(false);

  const onMountEvent = useEffectEvent(() => {
    setMounted(true);
    const cleanup = onMount?.();
    // Run cleanup on unmount. No need to set mounted=false here.
    return () => {
      cleanup?.();
    };
    // Deliberately run once on mount/unmount only.
  });

  useEffect(() => {
    onMountEvent();
  }, []);

  return mounted;
};

export default useEffectMount;
