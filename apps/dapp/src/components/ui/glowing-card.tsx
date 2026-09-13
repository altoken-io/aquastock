import React from 'react';
import { cn } from '@/utils/classNames';

// Color compositions for each variant
const VARIANT_COLORS = {
  emerald: {
    light: {
      background: '#cddbd5',
      border: 'rgba(16, 185, 129, 0.3)',
      glow: 'rgba(16, 185, 129, 0.2)',
      dot: '#10b981',
    },
    dark: {
      background: '#022c22',
      border: 'rgba(16, 185, 129, 0.5)',
      glow: 'rgba(16, 185, 129, 0.3)',
      dot: '#10b981',
    },
  },
  amber: {
    light: {
      background: '#f5ede4',
      border: 'rgba(245, 158, 11, 0.3)',
      glow: 'rgba(245, 158, 11, 0.2)',
      dot: '#f59e0b',
    },
    dark: {
      background: '#1e1711',
      border: 'rgba(245, 158, 11, 0.5)',
      glow: 'rgba(245, 158, 11, 0.3)',
      dot: '#f59e0b',
    },
  },
  blue: {
    light: {
      background: '#dfe7f2',
      border: 'rgba(59, 130, 246, 0.3)',
      glow: 'rgba(59, 130, 246, 0.2)',
      dot: '#3b82f6',
    },
    dark: {
      background: '#0c1e2e',
      border: 'rgba(59, 130, 246, 0.5)',
      glow: 'rgba(59, 130, 246, 0.3)',
      dot: '#3b82f6',
    },
  },
} as const;

type Variant = keyof typeof VARIANT_COLORS;

interface GlowingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: Variant;
}

export const GlowingCard = ({
  children,
  className,
  variant = 'emerald',
  ...props
}: GlowingCardProps) => {
  const colors = VARIANT_COLORS[variant];

  return (
    <>
      {/* Light theme card */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl md:rounded-3xl dark:hidden',
          className,
        )}
        style={{
          backgroundColor: colors.light.background,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: colors.light.border,
          boxShadow: `0 0 40px -10px ${colors.light.glow}`,
        }}
        {...props}
      >
        {/* Luminescence on top border */}
        <div
          className="absolute inset-x-0 top-0 h-[1px]"
          style={{
            background: `linear-gradient(to right, transparent, ${colors.light.border}, transparent)`,
            boxShadow: `0 0 20px 2px ${colors.light.glow}`,
          }}
        />

        {/* Dot pattern */}
        <div
          className="absolute inset-0 z-0 opacity-50"
          style={{
            backgroundImage: `radial-gradient(${colors.light.dot} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>

      {/* Dark theme card */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl md:rounded-3xl hidden dark:block',
          className,
        )}
        style={{
          backgroundColor: colors.dark.background,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: colors.dark.border,
          boxShadow: `0 0 40px -10px ${colors.dark.glow}`,
        }}
        {...props}
      >
        {/* Luminescence on top border */}
        <div
          className="absolute inset-x-0 top-0 h-[1px]"
          style={{
            background: `linear-gradient(to right, transparent, ${colors.dark.border}, transparent)`,
            boxShadow: `0 0 20px 2px ${colors.dark.glow}`,
          }}
        />

        {/* Dot pattern */}
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(${colors.dark.dot} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </>
  );
};
