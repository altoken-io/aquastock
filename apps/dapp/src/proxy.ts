import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Optimistic guard (cookie presence, not validity) for the admin console —
// the dashboard page itself validates the session server-side via
// auth.api.getSession. See memory: better-auth-scope.
export default function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const locale = request.nextUrl.pathname.split('/')[1] || 'en';
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/en/dashboard/:path*', '/es/dashboard/:path*'],
};
