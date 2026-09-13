import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  compress: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: true,
      },
    ];
  },
  experimental: {
    serverSourceMaps: false,
    optimizePackageImports: ['lucide-react', 'date-fns'],
    serverActions: {
      bodySizeLimit: '5mb', // Aumentado para permitir uploads de imágenes grandes
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'aquastock.io' },
      { protocol: 'https', hostname: 'app.aquastock.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    qualities: [70, 75, 80],
  },
  // Disable source maps to silence the warnings and slim builds
  productionBrowserSourceMaps: false,
  enablePrerenderSourceMaps: false,
  reactCompiler: true,
  // Dev runs on webpack (see `dev` script — `next dev --webpack`) to sidestep
  // a Tailwind v4 + Turbopack dev-mode cache-corruption bug (see CLAUDE.md).
  // webpack's native watcher (inotify) doesn't register file-level watches in
  // this dev environment, so edits never trigger a recompile — same symptom
  // as apps/dapp/next.config.ts. Polling sidesteps whatever swallows the
  // native events.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  transpilePackages: [
    '@aquastock/locales',
    '@aquastock/db-prisma',
    '@aquastock/ui',
    '@aquastock/config',
    '@aquastock/animation',
  ],
};

// Directory of the internationalization request configuration
const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/lib/i18n/request.ts',
});

export default withNextIntl(nextConfig);
