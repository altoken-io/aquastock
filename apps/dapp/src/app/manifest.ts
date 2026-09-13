import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AquaStock',
    short_name: 'AquaStock',
    description:
      'Send, receive, and convert PEN-backed stablecoins from your AquaStock wallet.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf7f3',
    theme_color: '#faf7f3',
    icons: [
      {
        src: '/assets/favicon/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/assets/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/assets/favicon/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
