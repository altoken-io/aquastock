import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AquaStock - PEN Stablecoin Settlement Layer',
    short_name: 'AquaStock',
    description:
      'PEN-backed stablecoin and settlement platform for B2B payments, remittances, treasury transfers, and merchant payouts across Latin America.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fce8eb',
    theme_color: '#e6153b',
    icons: [
      {
        src: '/assets/favicon/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
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
    ],
  };
}
