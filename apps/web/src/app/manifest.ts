import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AquaStock — Water Infrastructure Funding',
    short_name: 'AquaStock',
    description:
      'AquaStock lets a government anchor and community investors co-fund water infrastructure projects, tracked on-chain on Solana.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3d7a8a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
