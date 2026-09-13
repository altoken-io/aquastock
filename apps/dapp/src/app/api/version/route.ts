import { NextResponse } from 'next/server';

// Not statically cached — must reflect whichever deployment is currently
// serving this request, so the client-side update checker can detect when
// a new deploy has gone live.
export const dynamic = 'force-dynamic';

export function GET() {
  const buildId =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    'dev';

  return NextResponse.json(
    { buildId },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
