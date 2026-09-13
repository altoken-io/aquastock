'use client';

import { FC, useCallback } from 'react';
import { cn } from '@/utils/classNames';
import { useTheme } from 'next-themes';
import useEffectMount from '@/hooks/use-effect-mount';
import { LucideProps, Moon, Sun } from 'lucide-react';
import { MotionButton } from '@/components/helpers/motion/custom-lazy-motion';

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

  // useTheme is used to get the current theme and set the theme
  const { theme, setTheme } = useTheme();

  // newTheme is used to get the new theme found in local storage
  const currentTheme = theme === 'dark' ? 'light' : 'dark';

  // icon is used to get the icon for the new theme
  const Icon = themeIcons[currentTheme];

  // handleThemeChange is used to change the theme
  const handleThemeChange = useCallback(() => {
    setTheme(currentTheme);
  }, [setTheme, currentTheme]);

  // if the theme switcher is not mounted, return skeleton loader
  if (!isMounted)
    return (
      <div
        className={cn(
          'flex size-9 animate-pulse items-center justify-center rounded-full border border-red-900/10 bg-white/85 p-2.5 shadow-[0_10px_30px_-18px_rgba(127,29,29,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-black/75 dark:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)]',
          wrapperClassName,
        )}
      >
        <div
          className={cn(
            'h-4 w-4 rounded-full bg-red-900/20 dark:bg-white/20',
            className,
          )}
        />
      </div>
    );

  if (useIcon) {
    return (
      <MotionButton
        onClick={handleThemeChange}
        aria-label={`Switch to ${currentTheme} theme`}
        aria-pressed={theme === 'dark'}
        className={cn(
          'group flex size-9 items-center justify-center rounded-full border border-red-900/10 bg-white/85 p-2.5 text-stone-600 shadow-[0_10px_30px_-18px_rgba(127,29,29,0.18)] backdrop-blur-xl transition-all duration-300 ease-linear hover:border-red-900/20 hover:bg-red-50/80 hover:text-red-900 hover:shadow-[0_16px_40px_-20px_rgba(127,29,29,0.28)] active:scale-[0.98] active:bg-red-100/80 dark:border-white/10 dark:bg-black/75 dark:text-neutral-300 dark:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)] dark:hover:border-red-500/25 dark:hover:bg-red-950/35 dark:hover:text-red-300 dark:hover:shadow-[0_16px_40px_-20px_rgba(220,38,38,0.2)] dark:active:bg-neutral-900',
          wrapperClassName,
        )}
      >
        <Icon
          className={cn(
            'size-4 opacity-75 transition-all ease-in-out group-hover:scale-110 group-hover:opacity-100',
            className,
          )}
        />
      </MotionButton>
    );
  }

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      aria-label="Theme"
      className="rounded-full border border-red-900/10 bg-white/85 px-4 py-2 text-stone-900 shadow-[0_10px_30px_-18px_rgba(127,29,29,0.18)] backdrop-blur-xl transition-all duration-300 ease-in-out hover:border-red-900/20 hover:bg-red-50/80 dark:border-white/10 dark:bg-black/75 dark:text-neutral-100 dark:hover:border-red-500/25 dark:hover:bg-red-950/35"
    >
      <option value="dark">Dark</option>
      <option value="light">Light</option>
    </select>
  );
};

ThemeSwitcher.displayName = 'ThemeSwitcher';

export default ThemeSwitcher;
