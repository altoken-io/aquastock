import Image from 'next/image';
import { Marquee } from '@/components/helpers/marquee';
import { cn } from '@/utils/classNames';

export interface TickerItem {
  name: string;
  symbol: string;
  logo: string;
  color: string;
}

interface InfiniteTickerProps {
  items: TickerItem[];
  className?: string;
}

export const InfiniteTicker = ({ items, className }: InfiniteTickerProps) => {
  return (
    <div
      className={cn(
        'relative flex w-full flex-col items-center justify-center overflow-hidden',
        className,
      )}
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
      }}
    >
      <Marquee pauseOnHover className="[--duration:20s]">
        {items.map((item) => (
          <div
            key={item.name}
            className={cn(
              'relative flex items-center gap-2 md:gap-3 lg:gap-4 rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-2 md:px-6 md:py-2 lg:px-8 lg:py-3 backdrop-blur-sm transition-all hover:bg-neutral-800',
              'hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]',
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full p-1 md:p-1.5',
                item.color,
              )}
            >
              <Image
                src={item.logo}
                alt={item.name}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm md:text-base lg:text-lg font-bold text-white">
                {item.symbol}
              </span>
              <span className="text-xs md:text-sm lg:text-base text-neutral-400">
                -
              </span>
              <span className="text-xs md:text-sm lg:text-base text-neutral-300">
                {item.name}
              </span>
            </div>
          </div>
        ))}
      </Marquee>
    </div>
  );
};
