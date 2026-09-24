import {
  AQUASTOCK_MARK_CURRENT_PATH,
  AQUASTOCK_MARK_DROP_PATH,
  AQUASTOCK_MARK_VIEWBOX,
} from '../../../packages/ui/src/brand/mark';
import { color } from '../theme';

/** The AquaStock drop, drawn from the same path data both apps use. */
export const BrandMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox={AQUASTOCK_MARK_VIEWBOX} aria-hidden>
    <path d={AQUASTOCK_MARK_DROP_PATH} fill={color.reservoir} />
    <path
      d={AQUASTOCK_MARK_CURRENT_PATH}
      fill="none"
      stroke={color.abyss}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);
