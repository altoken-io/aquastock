import { color, font } from '../theme';

export type TagStream = 'sponsor' | 'saver' | 'both' | 'chain' | 'neutral';

const DOTS: Record<TagStream, string[]> = {
  sponsor: [color.sponsor],
  saver: [color.saver],
  both: [color.sponsor, color.saver],
  chain: [color.ok],
  neutral: [color.reservoir],
};

/**
 * A chapter label: who is acting, as dots and a word. The stream colours never appear without
 * the word next to them.
 */
export const Tag: React.FC<{
  stream: TagStream;
  children: React.ReactNode;
  size?: number;
}> = ({ stream, children, size = 20 }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: font.mono,
      fontSize: size,
      fontWeight: 500,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: color.text,
    }}
  >
    <span style={{ display: 'flex', gap: 5 }}>
      {DOTS[stream].map((dot) => (
        <span
          key={dot}
          style={{
            width: size * 0.55,
            height: size * 0.55,
            borderRadius: '50%',
            backgroundColor: dot,
          }}
        />
      ))}
    </span>
    {children}
  </div>
);
