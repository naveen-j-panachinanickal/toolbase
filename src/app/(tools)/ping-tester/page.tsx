"use client";

import React, { useEffect, useRef, useMemo } from "react";
import {
    Activity, Play, Square, Trash2, Globe, Zap,
    AlertCircle, CheckCircle2, Clock, WifiOff,
    ChevronRight, Signal,
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { usePingTester } from "@/hooks/usePingTester";
import type { PingResult } from "@/lib/ping";

// ─── Colour helpers ──────────────────────────────────────────────────────────

function latencyHex(latency: number | null): string {
    if (latency === null) return "#6b7280";
    if (latency < 100) return "#10b981";
    if (latency < 300) return "#f59e0b";
    return "#ef4444";
}

// ─── Smooth cubic bezier helper ──────────────────────────────────────────────

function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx = (prev.x + curr.x) / 2;
        d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
}

// ─── Line Chart ──────────────────────────────────────────────────────────────

function LineGraph({ data }: { data: PingResult[] }) {
    // Layout constants in SVG user-units
    const YAXIS_W = 36;   // space for Y-axis labels
    const XAXIS_H = 16;   // space for X-axis labels
    const SVG_W = 520;
    const SVG_H = 160;
    const PLOT_X = YAXIS_W;
    const PLOT_Y = 8;
    const PLOT_W = SVG_W - YAXIS_W - 4;
    const PLOT_H = SVG_H - XAXIS_H - PLOT_Y;
    const GRID_LINES = 4;

    const latencies = data.map((r) => r.latency ?? 0);
    const rawMax = Math.max(100, ...latencies);
    // Round max up to a nice number
    const niceMax = Math.ceil(rawMax / 50) * 50;

    const toX = (i: number) =>
        data.length < 2
            ? PLOT_X + PLOT_W / 2
            : PLOT_X + (i / (data.length - 1)) * PLOT_W;
    const toY = (v: number) => PLOT_Y + PLOT_H - (v / niceMax) * PLOT_H;

    const pts = data.map((r, i) => ({ x: toX(i), y: toY(r.latency ?? 0), r }));
    const linePath = smoothPath(pts);
    const areaPath =
        linePath +
        (pts.length > 1
            ? ` L ${pts[pts.length - 1].x} ${PLOT_Y + PLOT_H} L ${pts[0].x} ${PLOT_Y + PLOT_H} Z`
            : "");

    const last = pts[pts.length - 1];
    const lastVal = last?.r.latency;

    return (
        <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ height: 160 }}
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                <linearGradient id="lgArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
                <clipPath id="plotClip">
                    <rect x={PLOT_X} y={PLOT_Y} width={PLOT_W} height={PLOT_H} />
                </clipPath>
            </defs>

            {/* Y-axis gridlines + labels */}
            {Array.from({ length: GRID_LINES + 1 }).map((_, i) => {
                const val = Math.round((niceMax / GRID_LINES) * (GRID_LINES - i));
                const y = toY(val);
                return (
                    <g key={i}>
                        <line
                            x1={PLOT_X} y1={y} x2={PLOT_X + PLOT_W} y2={y}
                            stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                            strokeDasharray={i === GRID_LINES ? "0" : "3 3"}
                        />
                        <text
                            x={PLOT_X - 4} y={y + 3.5}
                            textAnchor="end"
                            fontSize="9"
                            fill="rgba(156,163,175,0.6)"
                            fontFamily="monospace"
                        >
                            {val}ms
                        </text>
                    </g>
                );
            })}

            {/* Baseline */}
            <line
                x1={PLOT_X} y1={PLOT_Y + PLOT_H}
                x2={PLOT_X + PLOT_W} y2={PLOT_Y + PLOT_H}
                stroke="rgba(255,255,255,0.12)" strokeWidth="1"
            />

            {/* Area + line (clipped) */}
            <g clipPath="url(#plotClip)">
                {pts.length > 1 && (
                    <>
                        <path d={areaPath} fill="url(#lgArea)" />
                        <path
                            d={linePath}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </>
                )}

                {/* Data dots */}
                {pts.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#0d0e14" />
                        <circle
                            cx={p.x} cy={p.y} r="3"
                            fill={latencyHex(p.r.latency)}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="0.8"
                        >
                            <title>{p.r.latency !== null ? `${p.r.latency}ms` : "failed"}</title>
                        </circle>
                    </g>
                ))}
            </g>

            {/* Latest value callout */}
            {last && lastVal !== null && lastVal !== undefined && (
                <g>
                    {/* vertical dashed line */}
                    <line
                        x1={last.x} y1={PLOT_Y}
                        x2={last.x} y2={PLOT_Y + PLOT_H}
                        stroke={latencyHex(lastVal)}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.5"
                    />
                    {/* bubble */}
                    <rect
                        x={Math.min(last.x - 18, PLOT_X + PLOT_W - 40)}
                        y={last.y - 16}
                        width="38" height="14"
                        rx="4"
                        fill={latencyHex(lastVal)}
                        opacity="0.9"
                    />
                    <text
                        x={Math.min(last.x, PLOT_X + PLOT_W - 21)}
                        y={last.y - 6.5}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="bold"
                        fill="#fff"
                        fontFamily="monospace"
                    >
                        {lastVal}ms
                    </text>
                </g>
            )}

            {/* X-axis packet labels (sparse: show first, last, midpoint) */}
            {data.length > 0 && [
                0,
                Math.floor((data.length - 1) / 2),
                data.length - 1,
            ]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((idx) => (
                    <text
                        key={idx}
                        x={toX(idx)}
                        y={SVG_H - 3}
                        textAnchor="middle"
                        fontSize="8"
                        fill="rgba(156,163,175,0.5)"
                        fontFamily="monospace"
                    >
                        #{idx + 1}
                    </text>
                ))}
        </svg>
    );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

function BarChart({ data }: { data: PingResult[] }) {
    const YAXIS_W = 36;
    const XAXIS_H = 16;
    const SVG_W = 520;
    const SVG_H = 110;
    const PLOT_X = YAXIS_W;
    const PLOT_Y = 6;
    const PLOT_W = SVG_W - YAXIS_W - 4;
    const PLOT_H = SVG_H - XAXIS_H - PLOT_Y;
    const GRID_LINES = 3;

    const latencies = data.map((r) => r.latency ?? 0);
    const rawMax = Math.max(100, ...latencies);
    const niceMax = Math.ceil(rawMax / 50) * 50;

    const barW = data.length > 0 ? Math.max(4, (PLOT_W / Math.max(data.length, 20)) - 2) : 0;
    const slotW = PLOT_W / Math.max(data.length, 20);

    const toBarX = (i: number) => PLOT_X + i * slotW + (slotW - barW) / 2;
    const toBarH = (v: number) => Math.max(3, (v / niceMax) * PLOT_H);
    const toBarY = (v: number) => PLOT_Y + PLOT_H - toBarH(v);

    return (
        <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ height: 110 }}
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Y-axis gridlines + labels */}
            {Array.from({ length: GRID_LINES + 1 }).map((_, i) => {
                const val = Math.round((niceMax / GRID_LINES) * (GRID_LINES - i));
                const y = PLOT_Y + PLOT_H - (val / niceMax) * PLOT_H;
                return (
                    <g key={i}>
                        <line
                            x1={PLOT_X} y1={y} x2={PLOT_X + PLOT_W} y2={y}
                            stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                            strokeDasharray={i === GRID_LINES ? "0" : "3 3"}
                        />
                        <text
                            x={PLOT_X - 4} y={y + 3.5}
                            textAnchor="end" fontSize="9"
                            fill="rgba(156,163,175,0.6)" fontFamily="monospace"
                        >
                            {val}ms
                        </text>
                    </g>
                );
            })}

            {/* Bars */}
            {data.map((r, i) => {
                const v = r.latency ?? 0;
                const color = latencyHex(r.latency);
                const isLast = i === data.length - 1;
                const bx = toBarX(i);
                const bh = toBarH(v);
                const by = toBarY(v);
                return (
                    <g key={i}>
                        {/* glow for last */}
                        {isLast && (
                            <rect
                                x={bx - 1} y={by - 1}
                                width={barW + 2} height={bh + 2}
                                rx="3"
                                fill={color}
                                opacity="0.2"
                            />
                        )}
                        <rect
                            x={bx} y={by}
                            width={barW} height={bh}
                            rx="2"
                            fill={color}
                            opacity={isLast ? 1 : 0.65}
                        >
                            <title>{r.latency !== null ? `#${i + 1}: ${r.latency}ms` : `#${i + 1}: failed`}</title>
                        </rect>
                        {/* value label on last bar if there's room */}
                        {isLast && r.latency !== null && bh > 18 && (
                            <text
                                x={bx + barW / 2}
                                y={by + 10}
                                textAnchor="middle"
                                fontSize="7.5"
                                fontWeight="bold"
                                fill="rgba(255,255,255,0.85)"
                                fontFamily="monospace"
                            >
                                {r.latency}ms
                            </text>
                        )}
                    </g>
                );
            })}

            {/* Baseline */}
            <line
                x1={PLOT_X} y1={PLOT_Y + PLOT_H}
                x2={PLOT_X + PLOT_W} y2={PLOT_Y + PLOT_H}
                stroke="rgba(255,255,255,0.12)" strokeWidth="1"
            />

            {/* X-axis: packet labels (sparse) */}
            {data.length > 0 && [
                0,
                Math.floor((data.length - 1) / 2),
                data.length - 1,
            ]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((idx) => (
                    <text
                        key={idx}
                        x={toBarX(idx) + barW / 2}
                        y={SVG_H - 3}
                        textAnchor="middle"
                        fontSize="8"
                        fill="rgba(156,163,175,0.5)"
                        fontFamily="monospace"
                    >
                        #{idx + 1}
                    </text>
                ))}
        </svg>
    );
}

// ─── Pulsing status orb ──────────────────────────────────────────────────────

function StatusOrb({ isRunning, lastStatus }: { isRunning: boolean; lastStatus: string | null }) {
    const color = isRunning ? "#3b82f6"
        : lastStatus === "success" ? "#10b981"
        : lastStatus === "timeout" ? "#f59e0b"
        : lastStatus === "error" ? "#ef4444"
        : "#6b7280";

    return (
        <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
            {isRunning && (
                <m.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: color, opacity: 0.12 }}
                    animate={{ scale: [1, 1.7, 1], opacity: [0.12, 0, 0.12] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                />
            )}
            <m.div
                className="absolute inset-1.5 rounded-full"
                style={{ border: `1.5px solid ${color}`, opacity: 0.3 }}
                animate={isRunning ? { scale: [1, 1.25, 1], opacity: [0.3, 0.05, 0.3] } : {}}
                transition={{ duration: 1.6, repeat: Infinity, delay: 0.2 }}
            />
            <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: `${color}18`, border: `2px solid ${color}` }}
            >
                <Signal className="w-3.5 h-3.5" style={{ color }} />
            </div>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PingTesterPage() {
    const {
        results, isRunning, startPing, stopPing, clearResults,
        stats, target, setTarget, options, setOptions,
    } = usePingTester();

    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [results]);

    const handleStart = () => {
        if (!target) return;
        startPing(target, options);
    };

    const lastResult = results[results.length - 1] ?? null;
    const lastStatus = lastResult?.status ?? null;
    const chartData = results.slice(-20);

    const quality = useMemo(() => {
        if (results.length === 0) return null;
        if (stats.lossRate > 20) return { label: "Poor", color: "#ef4444" };
        if (stats.avg > 300) return { label: "High Latency", color: "#f59e0b" };
        if (stats.avg > 100) return { label: "Moderate", color: "#f59e0b" };
        return { label: "Good", color: "#10b981" };
    }, [results.length, stats]);

    return (
        <div className="min-h-screen bg-(--background) text-(--text-primary) font-display">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-5">

                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Ping Tester</h1>
                            <p className="text-[11px] text-(--text-muted)">HTTP latency · browser-only</p>
                        </div>
                    </div>
                    <ReturnToToolsButton />
                </header>

                {/* Command strip */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl border border-(--border-medium) bg-(--surface-overlay) backdrop-blur-xl shadow-sm dark:shadow-black/20">
                    <div className="flex-1 relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted) pointer-events-none" />
                        <Input
                            id="ping-target"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !isRunning && handleStart()}
                            placeholder="example.com  or  8.8.8.8"
                            className="pl-9 h-10 bg-(--input-bg) border-(--border-medium) rounded-xl text-sm"
                            disabled={isRunning}
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Label className="text-[11px] font-bold text-(--text-muted) uppercase shrink-0">Count</Label>
                        <Input
                            id="ping-count"
                            type="number"
                            value={options.packetCount}
                            onChange={(e) => setOptions((p) => ({ ...p, packetCount: parseInt(e.target.value) || 4 }))}
                            className="w-20 h-10 bg-(--input-bg) border-(--border-medium) rounded-xl text-sm text-center"
                            disabled={isRunning}
                            min={1} max={100}
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Label className="text-[11px] font-bold text-(--text-muted) uppercase shrink-0">Interval</Label>
                        <Input
                            id="ping-interval"
                            type="number"
                            value={options.interval}
                            onChange={(e) => setOptions((p) => ({ ...p, interval: parseInt(e.target.value) || 1000 }))}
                            className="w-24 h-10 bg-(--input-bg) border-(--border-medium) rounded-xl text-sm text-center"
                            disabled={isRunning}
                            min={100} max={10000}
                        />
                        <span className="text-[11px] text-(--text-muted)">ms</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <AnimatePresence mode="wait">
                            {!isRunning ? (
                                /* ── Start ── */
                                <m.button
                                    key="start"
                                    id="ping-start-btn"
                                    onClick={handleStart}
                                    disabled={!target}
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.92 }}
                                    transition={{ duration: 0.15 }}
                                    className="group relative inline-flex items-center gap-2 h-10 pl-3.5 pr-4 rounded-xl
                                               font-semibold text-sm text-white select-none
                                               disabled:opacity-40 disabled:pointer-events-none
                                               active:scale-[0.96] transition-transform duration-100"
                                    style={{
                                        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)",
                                        boxShadow: "0 2px 8px rgba(59,130,246,0.35), 0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.18)",
                                    }}
                                >
                                    {/* Hover glow */}
                                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        style={{ background: "linear-gradient(135deg, #60a5fa22, #3b82f611)" }} />
                                    {/* Shimmer sweep */}
                                    <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                                        <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent
                                                         group-hover:translate-x-[300%] transition-transform duration-500 ease-in-out" />
                                    </span>
                                    {/* Icon with pulse ring */}
                                    <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
                                        <span className="absolute inset-0 rounded-full bg-white/20
                                                         group-hover:scale-[2.2] group-hover:opacity-0
                                                         transition-all duration-500 ease-out" />
                                        <Play className="w-3.5 h-3.5 relative fill-white stroke-none" />
                                    </span>
                                    <span className="relative">Start Ping</span>
                                </m.button>
                            ) : (
                                /* ── Stop ── */
                                <m.button
                                    key="stop"
                                    id="ping-stop-btn"
                                    onClick={stopPing}
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.92 }}
                                    transition={{ duration: 0.15 }}
                                    className="group relative inline-flex items-center gap-2 h-10 pl-3.5 pr-4 rounded-xl
                                               font-semibold text-sm text-red-400 select-none border border-red-500/25
                                               bg-red-500/8 hover:bg-red-500/14 hover:border-red-500/40
                                               active:scale-[0.96] transition-all duration-150"
                                >
                                    <Square className="w-3.5 h-3.5 fill-red-400 stroke-none" />
                                    <span>Stop</span>
                                </m.button>
                            )}
                        </AnimatePresence>

                        {/* ── Clear ── */}
                        <button
                            id="ping-clear-btn"
                            onClick={clearResults}
                            disabled={isRunning || results.length === 0}
                            title="Clear results"
                            className="group inline-flex items-center justify-center w-10 h-10 rounded-xl
                                       border border-(--border-medium) bg-(--surface-secondary)
                                       text-(--text-muted) hover:text-red-400
                                       hover:border-red-500/20 hover:bg-red-500/6
                                       disabled:opacity-30 disabled:pointer-events-none
                                       transition-all duration-150 active:scale-95"
                        >
                            <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        </button>
                    </div>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Left column ─────────────────────────────────── */}
                    <div className="space-y-4">

                        {/* Status */}
                        <div className="p-4 rounded-2xl border border-(--border-subtle) bg-(--surface-overlay) backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <StatusOrb isRunning={isRunning} lastStatus={lastStatus} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted) mb-0.5">Status</div>
                                    <div className="font-bold text-base truncate">
                                        {isRunning ? "Pinging…"
                                            : results.length === 0 ? "Ready"
                                            : lastStatus === "success" ? "Reachable"
                                            : lastStatus === "timeout" ? "Timeout"
                                            : "Unreachable"}
                                    </div>
                                    {target && <div className="text-xs text-(--text-muted) truncate">{target}</div>}
                                </div>
                                {quality && (
                                    <span className="shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-full"
                                        style={{ color: quality.color, background: `${quality.color}15`, border: `1px solid ${quality.color}25` }}>
                                        {quality.label}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: "stat-sent",     label: "Sent",        value: stats.sent,                              icon: <ChevronRight className="w-3.5 h-3.5" />, accent: "#3b82f6" },
                                { id: "stat-received", label: "Received",    value: stats.received,                          icon: <CheckCircle2  className="w-3.5 h-3.5" />, accent: "#10b981" },
                                { id: "stat-loss",     label: "Loss",        value: `${stats.lossRate}%`,                    icon: <AlertCircle   className="w-3.5 h-3.5" />, accent: stats.lossRate > 0 ? "#ef4444" : "#6b7280" },
                                { id: "stat-avg",      label: "Avg Latency", value: results.length > 0 ? `${stats.avg}ms` : "—", icon: <Clock       className="w-3.5 h-3.5" />, accent: "#a855f7" },
                            ].map((s) => (
                                <div id={s.id} key={s.label} className="p-4 rounded-xl border border-(--border-subtle) bg-(--surface-overlay)">
                                    <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: s.accent }}>
                                        {s.icon}{s.label}
                                    </div>
                                    <div className="text-2xl font-black tabular-nums">{s.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Min / Max */}
                        <AnimatePresence>
                            {results.length > 0 && (
                                <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: "stat-min", label: "Min", value: `${stats.min}ms`, accent: "#10b981" },
                                        { id: "stat-max", label: "Max", value: `${stats.max}ms`, accent: "#ef4444" },
                                    ].map((s) => (
                                        <div id={s.id} key={s.label}
                                            className="px-4 py-3 rounded-xl border border-(--border-subtle) bg-(--surface-overlay) flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: s.accent }}>{s.label}</span>
                                            <span className="text-sm font-bold tabular-nums">{s.value}</span>
                                        </div>
                                    ))}
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Right column ─────────────────────────────────── */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        {/* Charts panel */}
                        <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay) backdrop-blur-xl overflow-hidden">
                            {/* Chart header */}
                            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-(--border-subtle)">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-(--text-muted)" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">Latency History</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-(--text-muted) uppercase tracking-wide">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Good &lt;100ms</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Slow &lt;300ms</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Bad</span>
                                </div>
                            </div>

                            <div className="px-5 pt-4 pb-2 space-y-4">
                                {chartData.length === 0 ? (
                                    <div className="h-36 flex items-center justify-center text-xs text-(--text-muted) italic">
                                        No data yet — start a ping to see charts
                                    </div>
                                ) : (
                                    <>
                                        {/* Line chart */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Latency Trend</span>
                                                {chartData.length > 0 && (
                                                    <span className="text-[10px] font-mono text-(--text-muted)">
                                                        avg <span className="text-(--text-primary) font-bold">{stats.avg}ms</span>
                                                        {" · "}min <span className="text-emerald-500 font-bold">{stats.min}ms</span>
                                                        {" · "}max <span className="text-red-500 font-bold">{stats.max}ms</span>
                                                    </span>
                                                )}
                                            </div>
                                            <LineGraph data={chartData} />
                                        </div>

                                        {/* Bar chart */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Per-Packet</span>
                                                <span className="text-[10px] text-(--text-muted) font-mono">last {chartData.length} of {results.length} packets</span>
                                            </div>
                                            <BarChart data={chartData} />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Live bar */}
                            <AnimatePresence>
                                {isRunning && (
                                    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="mx-5 mb-4 px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-center gap-2">
                                        <m.span className="w-1.5 h-1.5 rounded-full bg-blue-500"
                                            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
                                        <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Measuring latency…</span>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Terminal log */}
                        <div className="flex flex-col rounded-2xl border border-(--border-subtle) bg-gray-950 dark:bg-[#0d0e14] overflow-hidden" style={{ height: "calc(100dvh - 600px)", minHeight: 220 }}>
                            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 shrink-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                                <span className="text-[11px] font-bold text-white/25 uppercase tracking-widest ml-2">Ping Output</span>
                                {results.length > 0 && (
                                    <span className="ml-auto text-[10px] text-white/20 font-mono">{results.length} packet{results.length !== 1 ? "s" : ""}</span>
                                )}
                            </div>
                            <div ref={outputRef} id="ping-log"
                                className="overflow-y-auto flex-1 p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" style={{ minHeight: 0 }}>
                                <div className="font-mono text-xs space-y-1">
                                    {results.length === 0 ? (
                                        <span className="text-white/20 italic">
                                            {isRunning ? "Starting…" : "Enter a host above and press Start."}
                                        </span>
                                    ) : results.map((res, i) => (
                                        <m.div key={i}
                                            initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.18 }}
                                            className="flex items-center gap-3 py-0.5 border-b border-white/[0.04] last:border-0">
                                            <span className="text-white/20 shrink-0 w-7 text-right">#{String(i + 1).padStart(3, "0")}</span>
                                            <span className="text-white/25 shrink-0">[{res.timestamp}]</span>
                                            <span className="text-blue-400/70 shrink-0 truncate max-w-[160px]">{res.host}</span>
                                            <span className="flex-1 text-white/50">{res.latency !== null ? `time=${res.latency}ms` : "---"}</span>
                                            {res.status === "success" && (
                                                <span className="shrink-0 flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase">
                                                    <CheckCircle2 className="w-3 h-3" />OK
                                                </span>
                                            )}
                                            {res.status === "timeout" && (
                                                <span className="shrink-0 flex items-center gap-1 text-amber-400 font-bold text-[10px] uppercase">
                                                    <Clock className="w-3 h-3" />TIMEOUT
                                                </span>
                                            )}
                                            {res.status === "error" && (
                                                <span className="shrink-0 flex items-center gap-1 text-red-400 font-bold text-[10px] uppercase">
                                                    <WifiOff className="w-3 h-3" />ERROR
                                                </span>
                                            )}
                                        </m.div>
                                    ))}
                                    <AnimatePresence>
                                        {isRunning && (
                                            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="flex items-center gap-2 pt-1">
                                                <m.span className="w-1.5 h-3.5 bg-blue-400 inline-block rounded-sm"
                                                    animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                                                <span className="text-blue-400/50 text-[10px]">sending request…</span>
                                            </m.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
