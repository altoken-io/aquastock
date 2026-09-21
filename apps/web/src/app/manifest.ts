import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AquaStock — the employer match, on Solana',
    short_name: 'AquaStock',
    description:
      "AquaStock lets a sponsor fund a match on savers' deposits of tokenized SPYx. The match vests on-chain; leave early and keep your deposit and what has vested.",
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
