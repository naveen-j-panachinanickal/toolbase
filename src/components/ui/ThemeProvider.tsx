'use client';

/**
 * ThemeProvider — wraps next-themes for dark/light/system/daylight theme support.
 * Uses class-based strategy so Tailwind `dark:` variants and `.dark` CSS selectors work.
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark', 'system', 'daylight']}
            {...props}
        >
            {children}
        </NextThemesProvider>
    );
}
