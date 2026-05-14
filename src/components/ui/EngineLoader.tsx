'use client';

/**
 * EngineLoader
 *
 * A non-blocking WASM/Python warmup indicator for tool pages.
 * Shows a subtle animated bar + cycling status messages while the
 * engine is loading, then fades away invisibly when isReady = true.
 *
 * Philosophy: user sees the layout instantly; this unobtrusively
 * communicates background warmup without blocking interaction.
 */

import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type EngineType = 'python' | 'wasm' | 'js';

interface EngineLoaderProps {
    isReady: boolean;
    engine?: EngineType;
    /** Override the list of status messages cycled through during load */
    messages?: string[];
    className?: string;
}

const DEFAULT_MESSAGES: Record<EngineType, string[]> = {
    python: [
        'Fetching Python runtime…',
        'Warming up Python engine…',
        'Loading standard libraries…',
        'Almost ready…',
    ],
    wasm: [
        'Fetching WebAssembly module…',
        'Compiling WASM binary…',
        'Initializing runtime…',
        'Almost ready…',
    ],
    js: [
        'Loading processing library…',
        'Initializing…',
    ],
};

const ENGINE_LABEL: Record<EngineType, string> = {
    python: 'Python · WASM',
    wasm: 'WebAssembly',
    js: 'JavaScript',
};

export function EngineLoader({
    isReady,
    engine = 'python',
    messages,
    className,
}: EngineLoaderProps) {
    const msgs = messages ?? DEFAULT_MESSAGES[engine];
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        if (isReady) return;
        const interval = setInterval(() => {
            setMsgIndex(i => Math.min(i + 1, msgs.length - 1));
        }, 1600);
        return () => clearInterval(interval);
    }, [isReady, msgs.length]);

    return (
        <AnimatePresence>
            {!isReady && (
                <m.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.3 } }}
                    className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-2xl',
                        'border shadow-[0_2px_12px_var(--shadow-color)]',
                        'w-fit',
                        className
                    )}
                    style={{
                        background: 'var(--surface-elevated)',
                        borderColor: 'var(--border-subtle)',
                    }}
                >
                    {/* Animated spinner orb */}
                    <div className="relative w-4 h-4 shrink-0">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                        <div className="relative w-4 h-4 rounded-full bg-primary/60" />
                    </div>

                    <div className="flex flex-col leading-tight min-w-0">
                        <AnimatePresence mode="wait">
                            <m.span
                                key={msgIndex}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.2 }}
                                className="text-[12px] font-medium block"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {msgs[msgIndex]}
                            </m.span>
                        </AnimatePresence>
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                            {ENGINE_LABEL[engine]}
                        </span>
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
