import { Mouse } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { type ComponentProps } from 'react';

export type ScrollDownButtonProps = ComponentProps<'a'> &
  Readonly<{
    containerId: string;
    textClassName?: string;
  }>;

const ScrollDownButton = ({
  containerId,
  children,
  className,
  textClassName,
  ...props
}: ScrollDownButtonProps) => {
  return (
    <a
      href={`#${containerId}`}
      className={cn(
        'text-orange-300/75 hover:text-orange-400/75 active:text-orange-500/75 text-center text-nowrap flex flex-col items-center justify-center gap-2',
        className,
      )}
      {...props}
    >
      <p className={cn('text-xs font-light', textClassName)}>
        {children ?? 'Scroll Down'}
      </p>
      <Mouse className="size-4 animate-bounce" />
    </a>
  );
};

export default ScrollDownButton;
