import { PostHog } from 'posthog-node';

import { env } from '@/lib/env/client';

export default function PostHogClient() {
  const posthogKey = env('NEXT_PUBLIC_POSTHOG_KEY', true);
  const posthogHost = env('NEXT_PUBLIC_POSTHOG_HOST', true);

  if (!posthogKey || !posthogHost) {
    return null;
  }

  const posthogClient = new PostHog(posthogKey, {
    host: posthogHost,
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}
