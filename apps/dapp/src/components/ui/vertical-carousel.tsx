import Image from 'next/image';
import { cn } from '@/utils/classNames';

export interface CarouselItem {
  name: string;
  category: string;
  logo?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

interface VerticalCarouselProps {
  items: CarouselItem[];
  className?: string;
  direction?: 'up' | 'down';
  fadeColor?: string;
}

// Shadow colors for depth effect
const SHADOW_COLORS = {
  light: 'rgba(255, 255, 255, 1)',
  dark: 'rgba(30, 23, 17, 0.1)',
} as const;

export const VerticalCarousel = ({
  items,
  className,
  direction = 'up',
  fadeColor,
}: VerticalCarouselProps) => {
  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  // Use fadeColor for dark shadows if provided, otherwise use default
  const topDarkShadow = fadeColor
    ? `inset 0 20px 40px -10px ${fadeColor}`
    : `inset 0 20px 40px -10px ${SHADOW_COLORS.dark}`;

  const bottomDarkShadow = fadeColor
    ? `inset 0 -20px 40px -10px ${fadeColor}`
    : `inset 0 -20px 40px -10px ${SHADOW_COLORS.dark}`;

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden',
        className,
      )}
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
      }}
    >
      <div
        className={cn(
          'flex flex-col gap-2 md:gap-3 lg:gap-4 animate-vertical-scroll',
          direction === 'down' && 'animate-vertical-scroll-reverse',
        )}
        style={{
          animationDuration: '20s',
        }}
      >
        {duplicatedItems.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className={cn(
              'group relative flex min-h-[80px] mx-3 md:min-h-[90px] lg:min-h-[100px] items-center gap-3 md:gap-4 rounded-2xl border border-neutral-200 bg-white/80 px-3 md:px-4 lg:px-6 backdrop-blur-sm transition-all hover:scale-102 hover:border-emerald-500/50 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/80 dark:hover:bg-neutral-800',
              'hover:shadow-[0_0_30px_-10px_rgba(52,211,153,0.3)]',
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
                  width={88}
                  height={88}
                  className="object-contain"
                />
              </div>
            ) : item.icon ? (
              <div className="flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 flex-shrink-0 items-center justify-center rounded-xl text-emerald-600 dark:text-emerald-400">
                {item.icon}
              </div>
            ) : null}
            <div className="flex flex-col gap-1">
              <h4 className="text-sm md:text-base lg:text-lg font-bold text-neutral-900 dark:text-white">
                {item.name}
              </h4>
              <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                {item.category}
              </p>
            </div>
            <div className="absolute right-4 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Additional shadow layer for depth - Subtle inset shadow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-10 z-10 dark:hidden"
        style={{
          boxShadow: `inset 0 20px 40px -10px ${SHADOW_COLORS.light}`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-10 hidden dark:block z-10"
        style={{
          boxShadow: topDarkShadow,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 z-10 dark:hidden"
        style={{
          boxShadow: `inset 0 -20px 40px -10px ${SHADOW_COLORS.light}`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 hidden dark:block z-10"
        style={{
          boxShadow: bottomDarkShadow,
        }}
      />
    </div>
  );
};
