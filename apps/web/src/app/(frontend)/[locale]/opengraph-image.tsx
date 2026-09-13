import { ImageResponse } from 'next/og';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { routing } from '@/lib/i18n/routing';
import {
  AQUASTOCK_MARK_CURRENT_PATH,
  AQUASTOCK_MARK_DROP_PATH,
} from '@aquastock/ui/brand/mark';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'metadata',
  });

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 28,
        padding: '80px 96px',
        background: '#0e1b1f',
        color: '#f5f7f6',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width="56" height="56" viewBox="0 0 32 32">
          <path d={AQUASTOCK_MARK_DROP_PATH} fill="#5fb3c4" />
          <path
            d={AQUASTOCK_MARK_CURRENT_PATH}
            fill="none"
            stroke="white"
            strokeOpacity={0.6}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
        <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>
          AquaStock
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: -2,
          maxWidth: 920,
        }}
      >
        {t('openGraph.description')}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 18px',
            borderRadius: 999,
            border: '1px solid rgba(95,179,196,0.4)',
            color: '#5fb3c4',
            fontSize: 20,
          }}
        >
          Solana
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 18px',
            borderRadius: 999,
            border: '1px solid rgba(245,247,246,0.25)',
            color: '#c7d1cf',
            fontSize: 20,
          }}
        >
          Hackathon demo — devnet
        </div>
      </div>
    </div>,
    size,
  );
}
