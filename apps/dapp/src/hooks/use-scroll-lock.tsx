import { useEffect } from 'react';

/**
 * A hook that locks/unlocks body scroll by adding/removing CSS classes
 *
 * This hook prevents background scrolling when modals, drawers, or other overlay
 * components are open, while preserving the user's scroll position. It works by:
 * 1. Capturing the current scroll position when locking
 * 2. Setting body position to fixed with negative top offset
 * 3. Restoring scroll position when unlocking
 *
 * @param isLocked - Whether scroll should be locked (true) or unlocked (false)
 *
 * @example
 * ```tsx
 * const [isModalOpen, setIsModalOpen] = useState(false);
 * useScrollLock(isModalOpen);
 *
 * // When isModalOpen is true, body scroll is locked
 * // When isModalOpen is false, scroll is restored to previous position
 * ```
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      // Capture current scroll position before locking
      const scrollPosition = window.scrollY;

      // Prevent scroll by setting body to fixed position
      // Negative top offset compensates for scroll position to prevent jump
      document.body.style.top = `-${scrollPosition}px`;
      document.body.classList.add('scroll-lock');
    } else {
      // Extract the stored scroll position from body style
      const scrollPosition = Math.abs(
        Number(document.body.style.top.split('px')[0]),
      );

      // Remove scroll lock styling
      document.body.style.removeProperty('top');
      document.body.classList.remove('scroll-lock');

      // Restore original scroll position if it exists
      if (scrollPosition) {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'instant', // Instant scroll to avoid smooth animation
        });
      }
    }

    // Cleanup function ensures scroll lock is removed when component unmounts
    // This prevents scroll from staying locked if component unmounts unexpectedly
    return () => {
      document.body.classList.remove('scroll-lock');
    };
  }, [isLocked]);
}

export default useScrollLock;
