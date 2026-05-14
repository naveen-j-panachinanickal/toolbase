'use client';

/**
 * PrivacyBadge
 *
 * A small, elegant privacy indicator shown on every tool page.
 *
 * Collapsed state (always visible):
 *  - Green shield + "100% Local" label
 *  - Flashes "Processed locally ✓" briefly after any tool job completes
 *
 * Expanded state (click to toggle):
 *  - "0 bytes sent to network" claim
 *  - Technical explanation of the engine (Pyodide WASM vs pure browser JS)
 *  - "Verify in DevTools → Network tab" instruction
 *  - Dismissible — remembers dismissed state in localStorage
 *
 * Props:
 *   toolId — registry ID (e.g. "magic-pdf") used to look up engine metadata
 */

import React, { useState, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp, X, Zap, Activity } from 'lucide-react';
import { getToolById } from '@/config/tools.registry';
import { usePrivacyMonitor } from '@/hooks/usePrivacyMonitor';
import { useCapabilities } from '@/components/providers/CapabilityProvider';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'toolbase:privacy-panel-seen';

interface PrivacyBadgeProps {
    /** Registry tool ID — used to read wasmPowered / pythonPowered flags */
    toolId: string;
    /** Extra className for positioning override */
    className?: string;
}

// ─── engine label helpers ──────────────────────────────────────────────────────

function getEngineLabel(wasm?: boolean, python?: boolean): string {
    if (python) return 'Python · WebAssembly (Pyodide)';
    if (wasm) return 'WebAssembly';
    return 'Pure Browser · No Server';
}

function getEngineDetail(wasm?: boolean, python?: boolean): string {
    if (python) {
        return 'This tool runs a real Python interpreter compiled to WebAssembly (Pyodide) directly in your browser. Your files are processed in memory and never transmitted over the network.';
    }
    if (wasm) {
        return 'This tool uses WebAssembly to run native-speed code directly in your browser. All processing happens locally with no network calls.';
    }
    return 'This tool runs entirely in JavaScript inside your browser. No data is sent to any server at any point.';
}

// ─── component ────────────────────────────────────────────────────────────────

export function PrivacyBadge({ toolId, className }: PrivacyBadgeProps) {
    const { justProcessed } = usePrivacyMonitor();
    const capabilities = useCapabilities();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Resolve engine metadata from registry
    const tool = getToolById(toolId);
    const engineLabel = getEngineLabel(tool?.wasmPowered, tool?.pythonPowered);
    const engineDetail = getEngineDetail(tool?.wasmPowered, tool?.pythonPowered);
    const isWasm = !!tool?.wasmPowered;

    // Read dismissed state from localStorage after mount
    useEffect(() => {
        setMounted(true);
        try {
            if (localStorage.getItem(DISMISSED_KEY) === 'true') {
                setIsDismissed(true);
            }
        } catch {
            /* localStorage unavailable */
        }
    }, []);

    const handleDismiss = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDismissed(true);
        setIsExpanded(false);
        try {
            localStorage.setItem(DISMISSED_KEY, 'true');
        } catch {
            /* localStorage unavailable */
        }
    }, []);

    // Don't render until mounted (avoids SSR mismatch on localStorage reads)
    if (!mounted) return null;

    return (
        <div
            className={cn(
                'fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2',
                className
            )}
        >
            {/* ── Expanded panel ───────────────────────────────────────────────── */}
            <AnimatePresence>
                {isExpanded && (
                    <m.div
                        key="privacy-panel"
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className={cn(
                            'w-72 p-4 rounded-2xl',
                            'bg-white/95 backdrop-blur-2xl',
                            'border border-black/6',
                            'shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
                        )}
                    >
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <Shield size={14} className="text-emerald-600 fill-emerald-100" />
                                </div>
                                <span className="text-[13px] font-semibold text-[#1c1c1e]">
                                    Privacy Proof
                                </span>
                            </div>
                            <button
                                onClick={handleDismiss}
                                aria-label="Dismiss privacy panel"
                                className="p-1 rounded-full hover:bg-black/5 transition-colors"
                            >
                                <X size={13} className="text-black/35" />
                            </button>
                        </div>

                        {/* Bytes sent */}
                        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                            <span className="text-[11px] font-bold text-emerald-700 tabular-nums">
                                0 bytes
                            </span>
                            <span className="text-[11px] text-emerald-600">
                                sent to network
                            </span>
                        </div>

                        {/* Performance & Engine */}
                        <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-1.5">
                                {isWasm && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200 text-[10px] font-semibold text-yellow-700">
                                        <Zap size={9} className="fill-yellow-500" />
                                        WASM
                                    </span>
                                )}
                                <span className="text-[11px] font-medium text-[#636366]">
                                    {engineLabel}
                                </span>
                            </div>

                            {capabilities && (
                                <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                        capabilities.webGPU 
                                            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                            : "bg-orange-50 border border-orange-200 text-orange-700"
                                    )}>
                                        <Activity size={9} className={cn(capabilities.webGPU ? "text-emerald-500" : "text-orange-500")} />
                                        {capabilities.webGPU ? "WebGPU Accelerated" : "Compatibility Mode"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Explanation */}
                        <p className="text-[11px] text-[#8e8e93] leading-relaxed mb-3">
                            {engineDetail}
                        </p>

                        {/* Verify instruction */}
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-black/3 border border-black/5">
                            <span className="text-[10px] leading-relaxed text-[#636366] font-medium">
                                💡 Verify yourself: open{' '}
                                <span className="font-semibold text-[#1c1c1e]">
                                    DevTools → Network tab
                                </span>{' '}
                                while using this tool. You'll see zero file upload requests.
                            </span>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* ── Collapsed badge (always visible, unless dismissed) ───────────── */}
            <AnimatePresence mode="wait">
                {!isDismissed ? (
                    <m.button
                        key="badge"
                        layout
                        onClick={() => setIsExpanded((v) => !v)}
                        aria-label={isExpanded ? 'Collapse privacy panel' : 'Expand privacy details'}
                        aria-expanded={isExpanded}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer',
                            'border transition-all duration-200',
                            isExpanded
                                ? 'bg-white/95 backdrop-blur-2xl border-black/6 shadow-md'
                                : 'bg-white/80 backdrop-blur-xl border-black/6 shadow-sm hover:shadow-md hover:bg-white/95',
                            // Flash state — green glow
                            justProcessed && !isExpanded
                                ? 'border-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]'
                                : ''
                        )}
                    >
                        {/* Shield icon — green flash on processing complete */}
                        <m.div
                            animate={
                                justProcessed
                                    ? { scale: [1, 1.15, 1], transition: { duration: 0.4 } }
                                    : { scale: 1 }
                            }
                        >
                            <Shield
                                size={14}
                                className={cn(
                                    'transition-colors duration-300',
                                    justProcessed ? 'text-emerald-500 fill-emerald-100' : 'text-emerald-600 fill-emerald-50'
                                )}
                            />
                        </m.div>

                        {/* Label — switches between normal and flash text */}
                        <AnimatePresence mode="wait">
                            {justProcessed ? (
                                <m.span
                                    key="processed"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="text-[11px] font-semibold text-emerald-600 whitespace-nowrap"
                                >
                                    Processed locally ✓
                                </m.span>
                            ) : (
                                <m.span
                                    key="local"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="text-[11px] font-semibold text-[#1c1c1e] whitespace-nowrap"
                                >
                                    Private & Local
                                </m.span>
                            )}
                        </AnimatePresence>

                        {/* Toggle chevron */}
                        <m.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={12} className="text-black/30" />
                        </m.div>
                    </m.button>
                ) : (
                    /* Minimised dot when dismissed — click to restore */
                    <m.button
                        key="dot"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={() => {
                            setIsDismissed(false);
                            try { localStorage.removeItem(DISMISSED_KEY); } catch { /* noop */ }
                        }}
                        aria-label="Show privacy info"
                        title="Show privacy info"
                        className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-xl border border-black/6 shadow-sm flex items-center justify-center hover:bg-white/95 transition-colors"
                    >
                        <Shield size={13} className="text-emerald-600 fill-emerald-50" />
                    </m.button>
                )}
            </AnimatePresence>
        </div>
    );
}
