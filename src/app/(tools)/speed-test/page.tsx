"use client";

import React, { useMemo } from "react";
import { Play, Square, Timer, Download, Upload, Info, Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";
import { useSpeedTest, TestStage } from "@/hooks/useSpeedTest";
import { m, AnimatePresence } from "framer-motion";

/* ── Components ──────────────────────────────────────────────────────────── */

/**
 * A premium circular gauge for speed visualization.
 */
const SpeedGauge = ({ value, maxValue = 100, label, color, status, speedHistory }: { 
    value: number, 
    maxValue?: number, 
    label: string, 
    color: string,
    status: TestStage,
    speedHistory: number[]
}) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    
    // Needle rotation: -135 to 135 degrees (270 total)
    const needleRotation = (percentage / 100) * 270 - 135;

    return (
        <div className="relative flex items-center justify-center w-full max-w-[420px] mx-auto group">
            {/* Background Glow */}
            <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 ease-in-out" 
                style={{ 
                    opacity: status === 'idle' ? 0 : 0.15,
                    backgroundColor: status !== 'idle' ? color : 'transparent',
                    filter: 'blur(80px)',
                    borderRadius: '50%',
                    width: '300px',
                    height: '300px'
                }} 
            />

            <svg viewBox="0 0 300 300" className="w-full h-full relative z-10">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" style={{ transition: 'stop-color 0.5s ease' }} />
                        <stop offset="100%" stopColor={color} stopOpacity="1" style={{ transition: 'stop-color 0.5s ease' }} />
                    </linearGradient>
                    <filter id="needleGlow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Static Needle Center Hub (Moved to back) */}
                <circle cx="150" cy="150" r="8" fill="white" className="dark:fill-black opacity-50" />
                <circle cx="150" cy="150" r="5" fill={color} style={{ transition: 'fill 0.5s ease' }} className="opacity-50" />

                {/* Main Track */}
                <path
                    d="M 60 240 A 120 120 0 1 1 240 240"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="text-(--border-medium) opacity-20"
                />

                {/* Active Segment */}
                <m.path
                    d="M 60 240 A 120 120 0 1 1 240 240"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference * 0.75}
                    initial={{ strokeDashoffset: circumference * 0.75 }}
                    animate={{ strokeDashoffset: circumference * 0.75 * (1 - percentage / 100) }}
                    transition={{ type: "spring", damping: 30, stiffness: 60 }}
                />

                {/* Ticks & Labels */}
                {[...Array(11)].map((_, i) => {
                    const angle = (i * 27) + 135;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 150 + Math.cos(rad) * 105;
                    const y1 = 150 + Math.sin(rad) * 105;
                    const x2 = 150 + Math.cos(rad) * 115;
                    const y2 = 150 + Math.sin(rad) * 115;
                    return (
                        <line
                            key={i}
                            x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="currentColor"
                            strokeWidth={i % 5 === 0 ? "3" : "1.5"}
                            className="text-(--text-muted) opacity-40"
                        />
                    );
                })}

                {/* Needle */}
                <m.g
                    initial={{ rotate: -135 }}
                    animate={{ rotate: needleRotation }}
                    transition={{ type: "spring", damping: 15, stiffness: 45 }}
                    style={{ transformOrigin: "150px 150px" }}
                >
                    {/* Needle Body */}
                    <path
                        d="M 150 150 L 150 50"
                        stroke={color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        filter="url(#needleGlow)"
                        style={{ transition: 'stroke 0.5s ease' }}
                    />
                </m.g>
            </svg>

            {/* Central Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center translate-y-8 z-20">
                <div className="flex flex-col items-center">
                    <m.span 
                        key={status === 'idle' ? 'idle' : 'active'}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-7xl md:text-8xl font-black tabular-nums tracking-tighter transition-colors duration-500"
                        style={{ 
                            color,
                            textShadow: `0 0 40px ${color}33`
                        }}
                    >
                        {status === 'idle' ? '0' : Math.round(value)}
                    </m.span>
                    <span className="text-xs font-black tracking-[0.2em] text-(--text-muted) -mt-2 opacity-50">
                        {label}
                    </span>
                </div>

                {/* Stability Sparkline */}
                <div className="mt-4 flex items-end gap-1 h-6 opacity-40">
                    {(speedHistory.length > 0 ? speedHistory : [...Array(12)]).map((val, i) => {
                        const h = typeof val === 'number' ? Math.max(4, (val / (maxValue || 1)) * 24) : 4;
                        return (
                            <m.div
                                key={i}
                                initial={{ height: 4 }}
                                animate={{ height: h }}
                                className="w-1.5 rounded-full transition-colors duration-500"
                                style={{ backgroundColor: color }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Status Badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                 <div className={cn(
                     "px-4 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500",
                     status === 'idle' ? "bg-(--surface-secondary) border-(--border-subtle) text-(--text-muted)" :
                     "shadow-lg"
                 )}
                 style={{ 
                     backgroundColor: status !== 'idle' ? `${color}11` : undefined,
                     borderColor: status !== 'idle' ? `${color}33` : undefined,
                     color: status !== 'idle' ? color : undefined,
                 }}>
                    {status === 'idle' ? 'Engine Idle' : 
                     status === 'ping' ? 'Latency Sync' :
                     status === 'download' ? 'Data Stream (In)' :
                     status === 'upload' ? 'Data Stream (Out)' :
                     'Optimization Complete'}
                 </div>
            </div>
        </div>
    );
};

export default function SpeedTestPage() {
    const { status, results, currentSpeed, error, startTest, stopTest, speedHistory } = useSpeedTest();

    const isRunning = status === 'ping' || status === 'download' || status === 'upload';

    /**
     * Maps a value to a premium color based on intensity.
     */
    const getDynamicColor = (val: number, max: number, stage: TestStage) => {
        if (stage === 'idle') return "var(--text-muted)";
        if (stage === 'ping') return "#f59e0b"; // Keep amber for ping for clarity

        const pct = Math.min(val / max, 1);
        
        // Interpolate between Orange (30), Green (140), and Violet (270)
        // We'll use a multi-step interpolation for a premium feel
        let hue;
        if (pct < 0.3) {
            // 30 to 60 (Orange to Yellow)
            hue = 30 + (pct / 0.3) * 30;
        } else if (pct < 0.7) {
            // 60 to 160 (Yellow to Emerald)
            hue = 60 + ((pct - 0.3) / 0.4) * 100;
        } else {
            // 160 to 270 (Emerald to Violet)
            hue = 160 + ((pct - 0.7) / 0.3) * 110;
        }

        return `hsl(${hue}, 85%, 60%)`;
    };

    // UI Configuration
    const config = useMemo(() => {
        const c = {
            value: 0,
            maxValue: 100,
            label: "Mbps",
        };

        if (status === 'ping') {
            c.value = results.ping || 0;
            c.maxValue = 300;
            c.label = "ms";
        } else if (status === 'download') {
            c.value = currentSpeed;
            c.maxValue = Math.max(100, currentSpeed * 1.5);
            c.label = "Mbps";
        } else if (status === 'upload') {
            c.value = currentSpeed;
            c.maxValue = Math.max(50, currentSpeed * 1.5);
            c.label = "Mbps";
        } else if (status === 'complete') {
            c.value = results.download;
            c.maxValue = Math.max(100, results.download * 1.2);
            c.label = "Mbps";
        }
        return c;
    }, [status, currentSpeed, results]);

    const activeColor = getDynamicColor(config.value, config.maxValue, status);

    return (
        <div className="min-h-screen bg-(--background) text-(--text-primary) font-display overflow-x-hidden">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-12">
                
                {/* ── Header ─────────────────────────────────────────── */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Network Speed Test</h1>
                            <p className="text-[11px] text-(--text-muted)">
                                Local performance check · 100% browser-side
                            </p>
                        </div>
                    </div>
                    <ReturnToToolsButton />
                </header>

                {/* ── Main Workspace ──────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left: Meter */}
                    <div className="lg:col-span-7 flex flex-col items-center space-y-8">
                        <SpeedGauge 
                            value={config.value} 
                            maxValue={config.maxValue} 
                            label={config.label} 
                            color={activeColor}
                            status={status}
                            speedHistory={speedHistory}
                        />

                        {/* Controls */}
                        <div className="flex items-center gap-4">
                            {!isRunning ? (
                                <m.button
                                    onClick={startTest}
                                    whileTap={{ scale: 0.96 }}
                                    className="group relative inline-flex items-center gap-3 h-14 pl-6 pr-8 rounded-2xl
                                               font-bold text-base text-white select-none shadow-xl shadow-blue-500/20"
                                    style={{
                                        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Play className="w-4 h-4 fill-current" />
                                    </div>
                                    {status === 'complete' ? 'Test Again' : 'Begin Test'}
                                </m.button>
                            ) : (
                                <button
                                    onClick={stopTest}
                                    className="inline-flex items-center gap-3 h-14 px-8 rounded-2xl
                                               bg-(--surface-secondary) border border-(--border-medium)
                                               font-bold text-base text-red-500 hover:bg-red-500/5 hover:border-red-500/20 transition-all active:scale-95"
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                    Cancel Test
                                </button>
                            )}

                            {status === 'complete' && (
                                <button
                                    onClick={stopTest}
                                    className="w-14 h-14 rounded-2xl bg-(--surface-overlay) border border-(--border-medium) flex items-center justify-center text-(--text-muted) hover:text-(--text-primary) transition-all active:scale-95"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Results Cards */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-(--text-muted) mb-4 px-2">
                            Detailed Metrics
                        </div>

                        {/* Ping */}
                        <div className={cn(
                            "group p-6 rounded-3xl border transition-all duration-300",
                            status === 'ping' ? "border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/5" : "border-(--border-medium) bg-(--surface-overlay)"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <Timer className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Latency</div>
                                        <div className="text-2xl font-black tabular-nums">{results.ping ? results.ping : '—'} <span className="text-xs font-bold text-(--text-muted)">ms</span></div>
                                    </div>
                                </div>
                                {status === 'ping' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                            </div>
                        </div>

                        {/* Download */}
                        <div className={cn(
                            "group p-6 rounded-3xl border transition-all duration-300",
                            status === 'download' ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/5" : "border-(--border-medium) bg-(--surface-overlay)"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Download className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Download Speed</div>
                                        <div className="text-2xl font-black tabular-nums">{results.download ? Math.round(results.download) : (status === 'download' ? Math.round(currentSpeed) : '—')} <span className="text-xs font-bold text-(--text-muted)">Mbps</span></div>
                                    </div>
                                </div>
                                {status === 'download' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
                            </div>
                        </div>

                        {/* Upload */}
                        <div className={cn(
                            "group p-6 rounded-3xl border transition-all duration-300",
                            status === 'upload' ? "border-purple-500/50 bg-purple-500/5 shadow-lg shadow-purple-500/5" : "border-(--border-medium) bg-(--surface-overlay)"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Upload Speed</div>
                                        <div className="text-2xl font-black tabular-nums">{results.upload ? Math.round(results.upload) : (status === 'upload' ? Math.round(currentSpeed) : '—')} <span className="text-xs font-bold text-(--text-muted)">Mbps</span></div>
                                    </div>
                                </div>
                                {status === 'upload' && <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />}
                            </div>
                        </div>

                        {/* Info bar */}
                        <div className="pt-6 flex items-start gap-3 px-4 opacity-50">
                            <Info className="w-4 h-4 text-(--text-muted) shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider leading-relaxed">
                                Results may vary based on your network hardware and concurrent bandwidth usage. 
                                No data is uploaded or stored externally.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
