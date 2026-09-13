/* eslint-disable @next/next/no-img-element */
'use client';
import { cn } from '@/utils/classNames';
import { ImgHTMLAttributes, JSX, useCallback, useRef, useState } from 'react';

type LazyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: JSX.Element; // shown until fully decoded
  errorFallback?: JSX.Element; // shown if load fails
  wrapperClassName?: string; // styles the outer wrapper
  fadeClassName?: string; // override default fade-in
};

const LazyImage = ({
  fallback,
  errorFallback,
  className,
  wrapperClassName,
  fadeClassName,
  onLoad,
  onError,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleLoad = useCallback<NonNullable<typeof onLoad>>(
    async (e) => {
      const img = imageRef.current;
      if (img?.decode) {
        try {
          // Ensure pixels are decoded before revealing
          await img.decode();
        } catch {
          // decode can throw on some browsers; fall back to onLoad
        }
      }
      setIsLoaded(true);
      onLoad?.(e);
    },
    [onLoad],
  );

  const handleError = useCallback<NonNullable<typeof onError>>(
    (e) => {
      setHasError(true);
      onError?.(e);
    },
    [onError],
  );

  return (
    <div
      className={cn('relative inline-block', wrapperClassName)}
      aria-busy={!isLoaded}
    >
      {/* Fallback overlay until image is decoded or when it errors (if errorFallback provided) */}
      {!isLoaded &&
        !hasError &&
        (fallback ?? (
          <div className="absolute inset-0 pointer-events-none bg-neutral-100/75 dark:bg-neutral-900/75 animate-pulse rounded-lg" />
        ))}
      {hasError && errorFallback && (
        <div className="absolute inset-0 pointer-events-none bg-neutral-100/75 dark:bg-neutral-900/75 animate-pulse rounded-lg" />
      )}

      {/* <div className="absolute inset-0 pointer-events-none bg-neutral-100/75 dark:bg-neutral-900/75 animate-pulse rounded-lg" /> */}
      <img
        ref={imageRef}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        decoding={decoding}
        alt={props.alt ?? 'lazy-image'}
        // Fade in when decoded; keep in normal flow to prevent layout shift
        className={cn(
          'block rounded-md transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          fadeClassName,
          className,
        )}
        {...props}
      />
    </div>
  );
};

export default LazyImage;
