'use client';

/**
 * PerformanceToast
 * 
 * A subtle, floating chip that appears after a tool process completes.
 * Shows the duration (e.g. 0.4s) and the engine that powered it.
 * 
 * Only appears for jobs taking > 100ms.
 */

import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Zap, Cpu, Sparkles } from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { cn } from '@/lib/utils';

export function PerformanceToast() {
    const { result, clear } = usePerformanceMonitor();

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <AnimatePresence>
                {result && (
                    <m.div
                        initial={{ opacity: 0, y: 12, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                        className={cn(
                            "pointer-events-auto cursor-default",
                            "flex items-center gap-3 px-4 py-2.5 rounded-2xl",
                            "bg-black/90 text-white backdrop-blur-xl",
                            "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
                            "border border-white/10"
                        )}
                    >
                        {/* Engine Icon */}
                        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/10">
                            {result.engine === 'Python' || result.engine === 'WASM' ? (
                                <Zap size={14} className="text-yellow-400 fill-yellow-400/20" />
                            ) : result.engine === 'JS' ? (
                                <Cpu size={14} className="text-blue-400" />
                            ) : (
                                <Sparkles size={14} className="text-purple-400" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-white/90">
                                Processed locally in
                                <span className="ml-1.5 font-bold text-white tabular-nums">
                                    {(result.durationMs / 1000).toFixed(1)}s
                                </span>
                            </span>

                            <div className="h-3 w-px bg-white/20 mx-1" />

                            <span className="text-[11px] font-bold tracking-wider text-white/40 uppercase">
                                {result.engine}
                            </span>
                        </div>

                        {/* Close hint (subtle) */}
                        <button
                            onClick={clear}
                            className="ml-1 p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        </button>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
