import type { MetadataRoute } from 'next';

const APP_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
  ? process.env.NEXT_PUBLIC_BASE_URL
  : 'https://app.aquastock.io';

export default function robots(): MetadataRoute.Robots {
  if (process.env.NODE_ENV === 'production') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${APP_BASE_URL}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${APP_BASE_URL}/sitemap.xml`,
  };
}
 