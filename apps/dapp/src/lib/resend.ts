import { Resend } from 'resend';

import { env } from '@/lib/env/server';

let client: Resend | null = null;

const getClient = (): Resend => {
  if (!client) {
    client = new Resend(env('RESEND_API_KEY'));
  }
  return client;
};

// Lazily constructed: `auth.ts` imports this module at the top level for a
// hook that only fires on signup, so eagerly calling `new Resend(...)` here
// would throw on every request (login included) whenever RESEND_API_KEY is
// unset, not just the ones that actually send an email.
export const resend = new Proxy({} as Resend, {
  get: (_target, prop, receiver) => Reflect.get(getClient(), prop, receiver),
});

export default resend;
