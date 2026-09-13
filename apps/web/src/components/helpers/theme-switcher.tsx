'use client';

import { FC, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { cn } from '@/utils/classNames';
import { useTheme } from 'next-themes';
import useEffectMount from '@/hooks/use-effect-mount';
import { LucideProps, Moon, Sun } from 'lucide-react';
import { useReducedMotion } from 'motion/react';

const themeIcons = {
  dark: Moon,
  light: Sun,
} as const;

interface ThemeSwitcherProps extends LucideProps {
  readonly useIcon?: boolean;
  readonly wrapperClassName?: string;
}

const ThemeSwitcher: FC<ThemeSwitcherProps> = ({
  className,
  wrapperClassName,
  useIcon = true,
}) => {
  // useMount is used to prevent the theme switcher from being rendered on the server
  const isMounted = useEffectMount();
  const prefersReducedMotion = useReducedMotion();

  // useTheme is used to get the current theme and set the theme
  const { theme, setTheme } = useTheme();

  // newTheme is used to get the new theme found in local storage
  const currentTheme = theme === 'dark' ? 'light' : 'dark';

  // icon is used to get the icon for the new theme
  const Icon = themeIcons[currentTheme];

  // handleThemeChange reveals the incoming theme with a ripple centered on
  // the button the user pressed (native View Transitions API — see the
  // ::view-transition-new(root) rule in globals.css). Falls back to a plain
  // theme swap when the API or reduced-motion preference isn't available.
  const handleThemeChange = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (
        prefersReducedMotion ||
        typeof document === 'undefined' ||
        !document.startViewTransition
      ) {
        setTheme(currentTheme);
        return;
      }

      const { left, top, width, height } =
        event.currentTarget.getBoundingClientRect();
      document.documentElement.style.setProperty(
        '--vt-x',
        `${left + width / 2}px`,
      );
      document.documentElement.style.setProperty(
        '--vt-y',
        `${top + height / 2}px`,
      );

      document.startViewTransition(() => {
        flushSync(() => setTheme(currentTheme));
      });
    },
    [currentTheme, prefersReducedMotion, setTheme],
  );

  // if the theme switcher is not mounted, return skeleton loader
  if (!isMounted)
    return (
      <div
        className={cn(
          'flex size-9 animate-pulse items-center justify-center rounded-full border border-border/70 bg-background/60 backdrop-blur-md',
          wrapperClassName,
        )}
      >
        <div
          className={cn('h-4 w-4 rounded-full bg-foreground/15', className)}
        />
      </div>
    );

  if (useIcon) {
    return (
      <button
        type="button"
        onClick={handleThemeChange}
        aria-label={`Switch to ${currentTheme} theme`}
        aria-pressed={theme === 'dark'}
        className={cn(
          'group flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/60 text-foreground/70 backdrop-blur-md transition-colors duration-300 ease-out hover:border-primary/30 hover:bg-accent hover:text-foreground active:scale-95',
          wrapperClassName,
        )}
      >
        <Icon
          className={cn(
            'size-4 transition-transform duration-300 ease-out group-hover:scale-110',
            className,
          )}
        />
      </button>
    );
  }

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      aria-label="Theme"
      className="rounded-full border border-border/70 bg-background/60 px-4 py-2 text-foreground backdrop-blur-md transition-colors duration-300 ease-out hover:border-primary/30 hover:bg-accent"
    >
      <option value="dark">Dark</option>
      <option value="light">Light</option>
    </select>
  );
};

ThemeSwitcher.displayName = 'ThemeSwitcher';

export default ThemeSwitcher;
