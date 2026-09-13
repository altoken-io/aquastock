import { ImageResponse } from 'next/og';

import {
  AQUASTOCK_MARK_CURRENT_PATH,
  AQUASTOCK_MARK_DROP_PATH,
} from '@aquastock/ui/brand/mark';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0e1b1f',
      }}
    >
      <svg width="112" height="112" viewBox="0 0 32 32">
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
    </div>,
    size,
  );
}
