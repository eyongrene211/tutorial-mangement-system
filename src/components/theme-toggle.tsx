'use client';

import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme }          from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      {resolvedTheme === 'dark' ? (
        <IconSun className="w-5 h-5 text-yellow-500" />
      ) : (
        <IconMoon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
}