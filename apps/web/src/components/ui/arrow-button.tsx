import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/utils/classNames';

interface ArrowButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export const ArrowButton = React.forwardRef<
  HTMLAnchorElement,
  ArrowButtonProps
>(({ href, children, className, ...props }, ref) => {
  return (
    <Link
      ref={ref}
      href={href}
      className={cn(
        'group relative inline-flex items-center gap-3 pl-4 lg:pl-6 pr-1 lg:pr-2 py-1 lg:py-2 bg-white rounded-xl ',
        className,
      )}
      {...props}
    >
      <span className="text-black font-medium text-lg tracking-tight">
        {children}
      </span>
      <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-black rounded-xl overflow-hidden relative">
        <ArrowRight className="absolute w-5 h-5 text-white transition-all duration-300 ease-in-out group-hover:translate-x-[150%]" />
        <ArrowRight className="absolute w-5 h-5 text-white transition-all duration-300 ease-in-out -translate-x-[150%] group-hover:translate-x-0" />
      </div>
    </Link>
  );
});

ArrowButton.displayName = 'ArrowButton';

export default ArrowButton;
