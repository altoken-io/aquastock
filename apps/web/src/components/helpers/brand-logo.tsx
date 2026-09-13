import Image from 'next/image';

import { cn } from '@/utils/classNames';

type BrandLogoProps = {
  alt: string;
  size?: number;
  className?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
};

const BrandLogo = ({
  alt,
  size = 60,
  className,
  sizes = '(max-width: 640px) 52px, 60px',
  quality = 70,
  priority,
}: BrandLogoProps) => (
  <>
    <Image
      width={size}
      height={size}
      alt={alt}
      src="/assets/brand/logo-light-transparent.webp"
      className={cn('block object-contain dark:hidden', className)}
      sizes={sizes}
      quality={quality}
      priority={priority}
    />
    <Image
      width={size}
      height={size}
      alt={alt}
      src="/assets/brand/logo-dark-transparent.webp"
      className={cn('hidden object-contain dark:block', className)}
      sizes={sizes}
      quality={quality}
      priority={priority}
    />
  </>
);

export default BrandLogo;
