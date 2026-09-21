import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AquaStock dApp',
    short_name: 'AquaStock',
    description:
      "Connect a Solana wallet, deposit tokenized SPYx into a match pool, and watch the sponsor's match vest on-chain.",
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
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
