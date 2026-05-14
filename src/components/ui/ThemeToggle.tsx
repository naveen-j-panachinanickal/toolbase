'use client';

/**
 * ThemeToggle — compact dark/light/system/automatic theme switcher.
 * Uses next-themes useTheme() to read/write the current theme.
 * Renders a segmented pill with four icon-only buttons.
 * Includes interactive, animated tooltips for each mode positioned at the bottom.
 */

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, SunMoon } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type ThemeOption = 'light' | 'dark' | 'system' | 'daylight';

const OPTIONS: { value: ThemeOption; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
    { value: 'daylight', icon: SunMoon, label: 'Automatic' },
];

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [hoveredOption, setHoveredOption] = useState<ThemeOption | null>(null);

    // Avoid hydration mismatch — only render after mount
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div
                className="flex items-center rounded-full p-0.5"
                style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border-subtle)',
                    width: 120,
                    height: 32,
                }}
            />
        );
    }

    return (
        <div className="relative flex items-center">
            {/* Animated Tooltip Container (Bottom) */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex justify-center w-full pointer-events-none">
                <AnimatePresence>
                    {hoveredOption && (
                        <m.div
                            initial={{ opacity: 0, y: -4, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xl border whitespace-nowrap z-50 backdrop-blur-md"
                            style={{
                                background: 'var(--surface-elevated)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-subtle)',
                                boxShadow: '0 4px 20px var(--shadow-color)',
                            }}
                        >
                            {OPTIONS.find(o => o.value === hoveredOption)?.label}
                        </m.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Desktop: Segmented Pill */}
            <div
                className="hidden sm:flex items-center rounded-full p-0.5 transition-colors duration-200"
                style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border-subtle)',
                }}
            >
                {OPTIONS.map(({ value, icon: Icon, label }) => {
                    const active = theme === value;
                    return (
                        <button
                            key={value}
                            onClick={() => setTheme(value)}
                            onMouseEnter={() => setHoveredOption(value)}
                            onMouseLeave={() => setHoveredOption(null)}
                            aria-label={`Switch to ${label} theme`}
                            className={cn(
                                'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 cursor-pointer',
                                active
                                    ? 'shadow-sm'
                                    : 'hover:opacity-80'
                            )}
                            style={{
                                background: active ? 'var(--surface-elevated)' : 'transparent',
                                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                                boxShadow: active ? '0 1px 3px var(--shadow-color)' : 'none',
                            }}
                        >
                            <Icon size={14} strokeWidth={2} />
                        </button>
                    );
                })}
            </div>

            {/* Mobile: Single cycling button */}
            <div className="flex sm:hidden items-center">
                <button
                    onClick={() => {
                        const currentIndex = OPTIONS.findIndex(o => o.value === theme);
                        const nextIndex = (currentIndex + 1) % OPTIONS.length;
                        setTheme(OPTIONS[nextIndex].value);
                    }}
                    aria-label="Cycle theme"
                    className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 cursor-pointer"
                    style={{
                        background: 'var(--surface-hover)',
                        color: 'var(--text-muted)',
                    }}
                >
                    {OPTIONS.map(({ value, icon: Icon }) => 
                        theme === value && <Icon key={value} size={18} strokeWidth={2} />
                    )}
                </button>
            </div>
        </div>
    );
}
