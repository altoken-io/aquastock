'use client';

import { useEffect, useEffectEvent, useSyncExternalStore } from 'react';

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

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const useEffectMount = (onMount?: MountCallback) => {
  // useSyncExternalStore gives an SSR-safe "mounted" flag without setState-in-effect.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const onMountEvent = useEffectEvent(() => {
    const cleanup = onMount?.();
    return () => {
      cleanup?.();
    };
    // Deliberately run once on mount/unmount only.
  });

  useEffect(() => onMountEvent(), []);

  return mounted;
};

export default useEffectMount;
