'use client';

import { cn } from '@/utils/classNames';
import {
  useRef,
  useState,
  useCallback,
  VideoHTMLAttributes,
  useEffect,
} from 'react';

type LazyVideoProps = VideoHTMLAttributes<HTMLVideoElement> & {
  fallbackClassName?: string;
  wrapperClassName?: string;
  threshold?: number;
  rootMargin?: string;
};

const LazyVideo = ({
  className,
  wrapperClassName,
  fallbackClassName,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}: LazyVideoProps) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onLoadedData = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const onError = useCallback(() => {
    setHasError(true);
  }, []);

  // Intersection Observer for true lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(container);
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={containerRef} className={cn('relative w-full', wrapperClassName)}>
      {!isLoaded && !hasError && (
        <div
          className={cn(
            'absolute animate-pulse inset-0 z-0 w-full min-h-full bg-neutral-200/75 dark:bg-neutral-800/75',
            fallbackClassName,
          )}
          aria-label="Loading video..."
        />
      )}

      {hasError && (
        <div
          className={cn(
            'absolute inset-0 z-0 w-full min-h-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center',
            fallbackClassName,
          )}
        >
          <span className="text-red-600 dark:text-red-400">
            Failed to load video
          </span>
        </div>
      )}

      {isInView && (
        <video
          ref={videoRef}
          onLoadedData={onLoadedData}
          onError={onError}
          className={cn(
            'relative z-10 opacity-0 transition-opacity duration-300',
            isLoaded && 'opacity-100',
            className,
          )}
          preload="metadata"
          {...props}
        />
      )}
    </div>
  );
};

export default LazyVideo;
