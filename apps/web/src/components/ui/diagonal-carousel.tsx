import Image from 'next/image';
import { cn } from '@/utils/classNames';

export interface DiagonalCarouselItem {
  name: string;
  category: string;
  logo?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

interface DiagonalCarouselProps {
  items: DiagonalCarouselItem[];
  className?: string;
  fadeColor?: string;
}

// Shadow colors for depth effect
const SHADOW_COLORS = {
  light: 'rgba(223,231,242, 0.15)',
  dark: 'rgba(12, 30, 46, 1)',
} as const;

export const DiagonalCarousel = ({
  items,
  className,
  fadeColor,
}: DiagonalCarouselProps) => {
  // Create multiple rows for the diagonal effect
  const duplicatedItems = [...items, ...items, ...items, ...items];

  // Use fadeColor for dark shadows if provided, otherwise use default
  const leftDarkShadow = fadeColor
    ? `inset 20px 0 40px -10px ${fadeColor}`
    : `inset 20px 0 40px -10px ${SHADOW_COLORS.dark}`;

  const rightDarkShadow = fadeColor
    ? `inset -20px 0 40px -10px ${fadeColor}`
    : `inset -20px 0 40px -10px ${SHADOW_COLORS.dark}`;

  return (
    <div
      className={cn(
        'relative flex h-[250px] md:h-[350px] lg:h-[400px] w-full overflow-hidden',
        className,
      )}
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      }}
    >
      <div className="absolute inset-0 flex flex-col gap-6 -rotate-12 scale-125">
        {/* First row - moving right */}
        <div className="flex gap-4 animate-diagonal-scroll-right">
          {duplicatedItems.map((item, index) => (
            <DiagonalCard key={`row1-${index}`} item={item} />
          ))}
        </div>

        {/* Second row - moving left */}
        <div className="flex gap-4 animate-diagonal-scroll-left">
          {duplicatedItems.map((item, index) => (
            <DiagonalCard key={`row2-${index}`} item={item} />
          ))}
        </div>

        {/* Third row - moving right */}
        <div className="flex gap-4 animate-diagonal-scroll-right-slow">
          {duplicatedItems.map((item, index) => (
            <DiagonalCard key={`row3-${index}`} item={item} />
          ))}
        </div>
        {/* Fourth row - moving left */}
        <div className="flex gap-4 animate-diagonal-scroll-left-slow">
          {duplicatedItems.map((item, index) => (
            <DiagonalCard key={`row4-${index}`} item={item} />
          ))}
        </div>
      </div>

      {/* Additional shadow layers for depth - Subtle inset shadow */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 dark:hidden"
        style={{
          boxShadow: `inset 20px 0 40px -10px ${SHADOW_COLORS.light}`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 hidden dark:block z-10"
        style={{
          boxShadow: leftDarkShadow,
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 dark:hidden"
        style={{
          boxShadow: `inset -20px 0 40px -10px ${SHADOW_COLORS.light}`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24 hidden dark:block z-10"
        style={{
          boxShadow: rightDarkShadow,
        }}
      />
    </div>
  );
};

const DiagonalCard = ({ item }: { item: DiagonalCarouselItem }) => {
  return (
    <div
      className={cn(
        'group relative flex min-w-[200px] md:min-w-[240px] lg:min-w-[280px] flex-shrink-0 items-center gap-3 md:gap-4 rounded-2xl border border-neutral-200 bg-white/90 p-3 md:p-4 lg:p-5 backdrop-blur-md transition-all hover:scale-105 hover:border-emerald-500/50 dark:border-neutral-800 dark:bg-neutral-900/90',
        'hover:shadow-[0_0_30px_-10px_rgba(52,211,153,0.4)]',
      )}
    >
      {item.logo ? (
        <div
          className={cn(
            'flex h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 flex-shrink-0 items-center justify-center rounded-xl p-2 md:p-2.5',
            item.accentColor ||
              'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20',
          )}
        >
          <Image
            src={item.logo}
            alt={item.name}
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      ) : item.icon ? (
        <div
          className={cn(
            'flex h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 flex-shrink-0 items-center justify-center rounded-xl',
            item.accentColor ||
              'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-600 dark:text-emerald-400',
          )}
        >
          {item.icon}
        </div>
      ) : null}
      <div className="flex flex-col gap-0.5">
        <h4 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white">
          {item.name}
        </h4>
        <p className="text-[10px] md:text-xs text-neutral-600 dark:text-neutral-400">
          {item.category}
        </p>
      </div>
    </div>
  );
};
