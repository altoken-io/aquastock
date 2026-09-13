/**
 * The AquaStock mark: a single drop silhouette cut by one current line.
 * Kept as plain path data (not JSX) so the same geometry can be reused
 * inside an inline SVG component, a static `icon.svg`, and `ImageResponse`
 * (apple-icon, opengraph-image) across both apps — renderers that don't
 * share a component model, and apps that don't share a build.
 */
export const AQUASTOCK_MARK_VIEWBOX = '0 0 32 32';

export const AQUASTOCK_MARK_DROP_PATH =
  'M16 3C16 3 7 13.5 7 19A9 9 0 0 0 25 19C25 13.5 16 3 16 3Z';

export const AQUASTOCK_MARK_CURRENT_PATH =
  'M9 21.5C11 19.5 13 19.5 15 21.5C17 23.5 19 23.5 21 21.5';
