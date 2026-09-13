import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  compress: true,
  // Turbopack cannot resolve @arcjet/analyze-wasm's internal `_.` path on
  // Windows. Arcjet is server-only, so let Node resolve the package directly.
  serverExternalPackages: ['@arcjet/analyze-wasm'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: false,
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
