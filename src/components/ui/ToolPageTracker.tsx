'use client';

/**
 * ToolPageTracker
 *
 * A zero-UI client component that registers a tool visit in the
 * "Recently Used" list stored in localStorage.
 *
 * Mount this inside every tool page layout (server component) so that
 * navigation to any tool is recorded without adding client logic to the layout.
 *
 * This component renders nothing visible — it only fires a side-effect on mount.
 */

import { useEffect } from 'react';
import { useToolPreferences } from '@/hooks/useToolPreferences';

interface ToolPageTrackerProps {
    /** The tool registry ID, e.g. 'magic-pdf' */
    toolId: string;
}

export function ToolPageTracker({ toolId }: ToolPageTrackerProps) {
    const { addRecent } = useToolPreferences();

    useEffect(() => {
        if (toolId) {
            addRecent(toolId);
        }
        // Only fire on mount (page load / navigation) — not on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toolId]);

    return null;
}
