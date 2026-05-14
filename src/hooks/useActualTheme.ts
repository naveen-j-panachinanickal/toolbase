'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * useActualTheme — provide a reliable theme state that accounts for 
 * next-themes and the custom 'daylight' (Automatic) mode.
 */
export function useActualTheme() {
  const { theme, resolvedTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkTheme = () => {
      if (theme === 'daylight') {
        const hour = new Date().getHours();
        // Match the logic in DaylightManager (6 AM to 6 PM is light)
        setIsDark(hour < 6 || hour >= 18);
      } else {
        setIsDark(resolvedTheme === 'dark');
      }
    };

    // Run immediately and then on interval
    checkTheme();
    const interval = setInterval(checkTheme, 1000 * 60);
    return () => clearInterval(interval);
  }, [theme, resolvedTheme]);

  // Before mount, we don't know the theme, so we might return a default or false.
  // Standard practice for next-themes is to wait for mount.
  
  return {
    isDark: mounted ? isDark : false,
    mounted,
    editorTheme: (mounted && isDark) ? 'vs-dark' : 'vs'
  };
}
