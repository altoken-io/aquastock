'use client';

import { env } from '@/lib/env/client';
import { PostHogProvider } from '@posthog/react';
import posthog from 'posthog-js';

const posthogKey = env('NEXT_PUBLIC_POSTHOG_KEY', true);
const posthogHost = env('NEXT_PUBLIC_POSTHOG_HOST', true);

if (typeof window !== 'undefined' && posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    disable_surveys: true,
    fetch_options: {
      cache: 'force-cache', // Use Next.js cache
      next_options: {
        // Passed to the `next` option for `fetch`
        revalidate: 60, // Cache for 60 seconds
        tags: ['posthog'], // Can be used with Next.js `revalidateTag` function
      },
    },
  });
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  // If PostHog is not configured, just render children without analytics
  if (!posthogKey || !posthogHost) {
    return <>{children}</>;
  }
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
