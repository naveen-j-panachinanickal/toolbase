'use client';

/**
 * Root template.tsx
 *
 * Next.js re-mounts `template.tsx` on every navigation, making it the
 * perfect place for page-entry animations. Unlike `layout.tsx`, which
 * is preserved across routes, templates unmount/remount on each change.
 *
 * Animation: subtle fade + 12px slide-up, 220ms ease-out.
 */

import { m } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.22,
                ease: [0.25, 0.46, 0.45, 0.94], // ease-out-quart
            }}
        >
            {children}
        </m.div>
    );
}
