'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

/**
 * DaylightManager — monitors the current time and applies the correct
 * visual theme (light/dark) when the 'daylight' mode is selected.
 * 
 * It uses a MutationObserver to ensure that next-themes doesn't 
 * overwrite our time-based class injection.
 */
export function DaylightManager() {
    const { theme } = useTheme();

    useEffect(() => {
        // Only run this logic if the user has specifically selected 'daylight'
        if (theme !== 'daylight') return;

        const updateDaylightTheme = () => {
            const hour = new Date().getHours();
            // 6 AM to 6 PM is considered "Day" (Light mode)
            const isDay = hour >= 6 && hour < 18;
            
            const html = document.documentElement;
            
            if (isDay) {
                // If it's day but we have the dark class, remove it
                if (html.classList.contains('dark')) {
                    html.classList.remove('dark');
                    html.style.colorScheme = 'light';
                }
            } else {
                // If it's night but we DON'T have the dark class, add it
                if (!html.classList.contains('dark')) {
                    html.classList.add('dark');
                    html.style.colorScheme = 'dark';
                }
            }
        };

        // Run immediately
        updateDaylightTheme();

        // 🛡️ Guard against next-themes resets
        // next-themes manages the 'class' attribute. If it sees 'theme=daylight',
        // it will ensure the class includes 'daylight' but might strip 'dark'.
        // We observe mutations and re-apply our rule if the class list changes.
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class') {
                    updateDaylightTheme();
                }
            }
        });

        observer.observe(document.documentElement, { 
            attributes: true,
            attributeFilter: ['class'] 
        });

        // Periodic check for transitions (e.g., exactly at 6:00 PM)
        const interval = setInterval(updateDaylightTheme, 60000);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, [theme]);

    return null;
}
