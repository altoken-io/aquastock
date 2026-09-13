import { ComponentProps } from 'react';
import { cn } from '@/utils/classNames';

export type SectionProps = {
  secClassName?: string;
} & ComponentProps<'section'>;

const Section = ({
  children,
  className,
  secClassName,
  ...props
}: SectionProps) => {
  return (
    <section {...props} className={cn('flex min-h-screen w-full', className)}>
      <section
        className={cn(
          'container mx-auto grow w-full flex flex-col',
          secClassName,
        )}
      >
        {children}
      </section>
    </section>
  );
};

export default Section;
