'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pinned-tools';

export function usePinnedTools() {
    const [pinnedTools, setPinnedTools] = useState<string[]>([]);

    // Initialize from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setPinnedTools(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse pinned tools', e);
            }
        }
    }, []);

    const togglePin = (toolId: string) => {
        setPinnedTools((prev) => {
            const isCurrentlyPinned = prev.includes(toolId);
            const next = isCurrentlyPinned
                ? prev.filter((id) => id !== toolId)
                : [...prev, toolId];

            // Sync side effects after state computation but out of band
            setTimeout(() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                window.dispatchEvent(new Event('pinned-tools-updated'));
            }, 0);

            return next;
        });
    };

    const isPinned = (toolId: string) => pinnedTools.includes(toolId);

    // Context sync listener
    useEffect(() => {
        const sync = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setPinnedTools((prev) => {
                        // Prevent unnecessary updates
                        if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
                        return parsed;
                    });
                } catch (e) {
                    console.error('Failed to parse pinned tools', e);
                }
            }
        };

        window.addEventListener('pinned-tools-updated', sync);
        window.addEventListener('storage', sync); // For other tabs

        return () => {
            window.removeEventListener('pinned-tools-updated', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);


    return { pinnedTools, togglePin, isPinned };
}
