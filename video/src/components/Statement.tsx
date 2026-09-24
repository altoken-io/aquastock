import { interpolate, useCurrentFrame } from 'remotion';

import { color, easeOut, font } from '../theme';
import { Tag, type TagStream } from './Tag';

/**
 * One thing a scene says: an optional tag, a headline, a supporting line and a footnote. It
 * rises in at `from` and fades out at `to` (scene frames), so a scene can swap statements in
 * place.
 */
export const Statement: React.FC<{
  from: number;
  to?: number;
  tag?: { stream: TagStream; text: string };
  title: string;
  body?: string;
  note?: React.ReactNode;
  titleSize?: number;
  width?: number;
}> = ({ from, to, tag, title, body, note, titleSize = 76, width = 760 }) => {
  const frame = useCurrentFrame();
  const clamp = {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  } as const;
  const inOpacity = interpolate(frame, [from, from + 16], [0, 1], clamp);
  const outOpacity =
    to === undefined ? 1 : interpolate(frame, [to - 12, to], [1, 0], clamp);
  if (inOpacity * outOpacity === 0) return null;
  const rise = interpolate(frame, [from, from + 24], [18, 0], {
    ...clamp,
    easing: easeOut,
  });
  const bodyIn = interpolate(frame, [from + 8, from + 26], [0, 1], clamp);
  const noteIn = interpolate(frame, [from + 16, from + 34], [0, 1], clamp);

  return (
    <div
      style={{
        position: 'absolute',
        width,
        opacity: inOpacity * outOpacity,
        translate: `0px ${rise}px`,
      }}
    >
      {tag ? <Tag stream={tag.stream}>{tag.text}</Tag> : null}
      <div
        style={{
          marginTop: tag ? 26 : 0,
          fontFamily: font.display,
          fontSize: titleSize,
          fontWeight: 500,
          lineHeight: 1.02,
          letterSpacing: '-0.028em',
          color: color.text,
        }}
      >
        {title}
      </div>
      {body ? (
        <div
          style={{
            marginTop: 28,
            fontFamily: font.sans,
            fontSize: 34,
            lineHeight: 1.4,
            color: color.muted,
            opacity: bodyIn,
          }}
        >
          {body}
        </div>
      ) : null}
      {note ? (
        <div
          style={{
            marginTop: 28,
            fontFamily: font.mono,
            fontSize: 18,
            lineHeight: 1.5,
            letterSpacing: '0.04em',
            color: color.muted,
            opacity: noteIn,
          }}
        >
          {note}
        </div>
      ) : null}
    </div>
  );
};
