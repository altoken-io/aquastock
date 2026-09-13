import {
  AQUASTOCK_MARK_CURRENT_PATH,
  AQUASTOCK_MARK_DROP_PATH,
  AQUASTOCK_MARK_VIEWBOX,
} from '@aquastock/ui/brand/mark';
import { cn } from '@/utils/classNames';

type BrandLogoProps = {
  alt: string;
  size?: number;
  className?: string;
};

/**
 * The AquaStock mark, drawn as a single inline SVG rather than a raster
 * asset — shared with apps/web via `@aquastock/ui/brand/mark`, so both apps'
 * logo/favicon/OG image stay in sync from one source of geometry.
 */
const BrandLogo = ({ alt, size = 32, className }: BrandLogoProps) => (
  <svg
    role="img"
    aria-label={alt}
    viewBox={AQUASTOCK_MARK_VIEWBOX}
    width={size}
    height={size}
    className={cn('shrink-0 text-primary', className)}
  >
    <path d={AQUASTOCK_MARK_DROP_PATH} fill="currentColor" />
    <path
      d={AQUASTOCK_MARK_CURRENT_PATH}
      fill="none"
      stroke="white"
      strokeOpacity={0.55}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </svg>
);

export default BrandLogo;
