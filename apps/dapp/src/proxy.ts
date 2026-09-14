import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Optimistic guard (cookie presence, not validity) for the admin console —
// the dashboard page itself validates the session server-side via
// auth.api.getSession. See memory: better-auth-scope. `/` is the sign-in
// page (see memory: dapp-home-is-login), so redirect there.
export default function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const locale = request.nextUrl.pathname.split('/')[1] || 'en';
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/en/dashboard/:path*', '/es/dashboard/:path*'],
};
