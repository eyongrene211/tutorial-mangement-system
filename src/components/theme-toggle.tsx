'use client';

import { useState, useCallback } from 'react';
import { Sun, Moon }             from 'lucide-react';

export function ThemeToggle() {
  // Initialize with loading state - no effects needed
  const [isClient, setIsClient] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Pure function - reads DOM directly, no state updates
  const getCurrentTheme = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Check localStorage first
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    
    // System preference fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Toggle handler - updates both DOM and localStorage
  const toggleTheme = useCallback(() => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    
    if (nextIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Initialize ON MOUNT using useLayoutEffect (runs synchronously after DOM paint)
  if (typeof window !== 'undefined' && !isClient) {
    const initialDark = getCurrentTheme();
    
    // Sync DOM class with initial theme
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setIsDark(initialDark);
    setIsClient(true);
  }

  // Show nothing until client-side hydration completes
  if (!isClient) {
    return (
      <div className="p-2 rounded-lg">
        <div className="w-5 h-5 bg-gray-300 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-500 transition-colors" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300 transition-colors" />
      )}
    </button>
  );
}
