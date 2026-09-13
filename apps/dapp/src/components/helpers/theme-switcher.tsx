'use client';

import { FC, useCallback } from 'react';
import { cn } from '@/utils/classNames';
import { useTheme } from 'next-themes';
import useEffectMount from '@/hooks/use-effect-mount';
import { LucideProps, Moon, Sun } from 'lucide-react';
import Select from '@aquastock/ui/tw/select';
import { Tooltip } from '@aquastock/ui/tw/tooltip';
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
          'flex size-8 animate-pulse items-center justify-center rounded-full bg-primary/15 p-2 dark:bg-primary/20',
          wrapperClassName,
        )}
      >
        <div
          className={cn(
            'h-5 w-5 rounded-full bg-primary/30 dark:bg-primary/35',
            className,
          )}
        />
      </div>
    );

  if (useIcon) {
    return (
      <Tooltip content={`Switch to ${currentTheme} theme`}>
        <MotionButton
          onClick={handleThemeChange}
          aria-label={`Switch to ${currentTheme} theme`}
          aria-pressed={theme === 'dark'}
          className={cn(
            'group flex size-8 items-center justify-center rounded-full border border-border/70 bg-card/80 p-2 text-muted-foreground transition-colors ease-linear hover:border-primary/20 hover:bg-primary/10 hover:text-foreground active:bg-secondary dark:bg-card/80',
            wrapperClassName,
          )}
        >
          <Icon
            className={cn(
              'size-4 opacity-60 transition-opacity ease-in-out group-hover:opacity-100',
              className,
            )}
          />
        </MotionButton>
      </Tooltip>
    );
  }

  return (
    <Select
      value={theme}
      onValueChange={(value) => setTheme(value ?? currentTheme)}
      aria-label="Theme"
      className="border-border bg-card text-foreground transition-all duration-500 ease-in-out"
      options={[
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
      ]}
    />
  );
};

ThemeSwitcher.displayName = 'ThemeSwitcher';

export default ThemeSwitcher;
