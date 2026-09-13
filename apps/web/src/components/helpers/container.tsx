import { ComponentProps } from 'react';

import { cn } from '@/utils/classNames';

export type ContainerProps = {
  sectionClassName?: string;
} & ComponentProps<'main'>;

const Container = ({
  children,
  className,
  sectionClassName,
  ...props
}: ContainerProps) => {
  return (
    <main
      {...props}
      className={cn(
        'flex min-h-screen w-full py-24 px-8 max-sm:px-4',
        className,
      )}
    >
      <section
        className={cn(
          'container mx-auto grow flex flex-col w-full',
          sectionClassName,
        )}
      >
        {children}
      </section>
    </main>
  );
};

export default Container;
