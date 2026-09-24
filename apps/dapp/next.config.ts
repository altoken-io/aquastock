import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Sent on every response. Deliberately no script CSP: wallet extensions inject scripts into the
// page, and a policy that blocks one breaks connecting. Framing is refused outright, which is
// what protects the sign-in form and the transaction buttons from clickjacking.
const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  compress: true,
  // An empty string when unset, so the test wallet's dynamic import (a `NEXT_PUBLIC` check in
  // providers/solana-provider.tsx) is dead code and never reaches a production bundle.
  env: {
    NEXT_PUBLIC_E2E_WALLET_SECRET:
      process.env.NEXT_PUBLIC_E2E_WALLET_SECRET ?? '',
  },
  // Turbopack cannot resolve @arcjet/analyze-wasm's internal `_.` path on
  // Windows. Arcjet is server-only, so let Node resolve the package directly.
  serverExternalPackages: ['@arcjet/analyze-wasm'],
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: false,
      },
      // The water-funding pages this product replaced. Old links land somewhere useful.
      {
        source: '/:locale(en|es)/projects/:path*',
        destination: '/:locale/pools',
        permanent: true,
      },
      {
        source: '/:locale(en|es)/impact',
        destination: '/:locale/my-match',
        permanent: true,
      },
      {
        source: '/:locale(en|es)/dashboard/projects',
        destination: '/:locale/dashboard/pools',
        permanent: true,
      },
      {
        source: '/:locale(en|es)/dashboard/milestones',
        destination: '/:locale/dashboard',
        permanent: true,
      },
    ];
  },
  experimental: {
    serverSourceMaps: false,
    optimizePackageImports: ['lucide-react', 'date-fns'],
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // Dev runs on webpack (see `dev` script — `next dev --webpack`) to sidestep
  // a Tailwind v4 + Turbopack dev-mode cache-corruption bug that intermittently
  // mangles globals.css's arbitrary-value utilities (see CLAUDE.md). Turbopack
  // is still used for `next build`.
  webpack: (config, { dev }) => {
    // webpack's native watcher (inotify) registers no file-level watches in
    // this dev environment — edits to already-compiled modules never
    // trigger a recompile even though a plain `fs.watch` on the same file
    // works fine (apps/web/next.config.ts carries the same fix for the same
    // symptom). Polling sidesteps whatever is swallowing the native events.
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'aquastock.io' },
      { protocol: 'https', hostname: 'app.aquastock.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    qualities: [70, 75, 80, 85],
  },
  productionBrowserSourceMaps: false,
  enablePrerenderSourceMaps: false,
  reactCompiler: true,
  transpilePackages: [
    '@aquastock/types',
    '@aquastock/locales',
    '@aquastock/db-prisma',
    '@aquastock/ui',
    '@aquastock/config',
  ],
};

// Directory of the internationalization request configuration
const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/lib/i18n/request.ts',
});

export default withNextIntl(nextConfig);
