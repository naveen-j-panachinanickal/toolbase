"use client";

import React from "react";
import { Shield, Trash2, AlertCircle, Cpu } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";

import { useRedactSecrets } from "@/hooks/useRedactSecrets";
import { RedactEditor } from "@/components/features/redact-secrets/RedactEditor";
import { RedactConfiguration } from "@/components/features/redact-secrets/RedactConfiguration";
import { RedactOutput } from "@/components/features/redact-secrets/RedactOutput";
import { RedactStats } from "@/components/features/redact-secrets/RedactStats";
import { EngineLoader } from "@/components/ui/EngineLoader";

export default function RedactSecretsPage() {
    const {
        content, setContent,
        contentType, setContentType,
        fileName,
        maskingStyle, setMaskingStyle,
        keys, setKeys,
        literalTexts, setLiteralTexts,
        regexPatterns, setRegexPatterns,
        response, error,
        isLoading, isReady, engineLabel,
        handleRedact, handleFileUpload, handleRulesUpload, clearAll, saveToNoteVault,
    } = useRedactSecrets();

    const isRust = engineLabel === "Rust WASM";

    return (
        <div className="h-screen bg-(--background) text-(--text-primary) font-display flex flex-col overflow-hidden">
            {/* Fixed Header & Command Strip */}
            <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-8 pb-4 space-y-6 shrink-0">
                {/* ── Header ─────────────────────────────────────────── */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Secret Redactor</h1>
                            <p className="text-[11px] text-(--text-muted)">
                                Protect PII & secrets · browser-only · WASM-powered
                            </p>
                        </div>
                    </div>
                    <ReturnToToolsButton />
                </header>

                {/* ── Command strip ───────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-(--border-medium) bg-(--surface-overlay) backdrop-blur-xl shadow-sm dark:shadow-black/20">
                    {/* Engine chip */}
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider",
                        isRust
                            ? "bg-sky-500/8 border-sky-500/20 text-sky-500"
                            : "bg-amber-500/8 border-amber-500/20 text-amber-500"
                    )}>
                        <Cpu className="w-3 h-3" />
                        {engineLabel}
                    </div>

                    {/* WASM loader — shows only while not ready */}
                    <div className="flex-1">
                        <EngineLoader isReady={isReady} engine="wasm" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                        {/* Clear */}
                        <button
                            onClick={clearAll}
                            title="Clear all"
                            className="group inline-flex items-center gap-1.5 h-10 pl-3 pr-3.5 rounded-xl
                                       border border-(--border-medium) bg-(--surface-secondary)
                                       text-sm font-medium text-(--text-muted)
                                       hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/6
                                       transition-all duration-150 active:scale-95"
                        >
                            <Trash2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                            Clear
                        </button>

                        {/* Redact Now */}
                        <m.button
                            onClick={handleRedact}
                            disabled={isLoading || !isReady || !content}
                            whileTap={{ scale: 0.96 }}
                            className="group relative inline-flex items-center gap-2 h-10 pl-4 pr-5 rounded-xl
                                       font-semibold text-sm text-white select-none
                                       disabled:opacity-40 disabled:pointer-events-none"
                            style={{
                                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 60%, #6d28d9 100%)",
                                boxShadow: "0 2px 8px rgba(139,92,246,0.35), 0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.18)",
                            }}
                        >
                            {/* Shimmer */}
                            <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                                <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent
                                                 group-hover:translate-x-[300%] transition-transform duration-500 ease-in-out" />
                            </span>
                            {/* Icon */}
                            <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
                                <span className="absolute inset-0 rounded-full bg-white/20
                                                 group-hover:scale-[2.2] group-hover:opacity-0
                                                 transition-all duration-500 ease-out" />
                                <Shield className="w-3.5 h-3.5 relative" />
                            </span>
                            <span className="relative">
                                {isLoading ? "Redacting…" : "Redact Now"}
                            </span>
                        </m.button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto px-4 md:px-8 pb-8 space-y-6">
                    {/* ── Main grid ───────────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Left: Editor + Output */}
                        <div className="lg:col-span-8 space-y-5">
                            <RedactEditor
                                content={content}
                                setContent={setContent}
                                contentType={contentType}
                                setContentType={setContentType}
                                fileName={fileName}
                                onFileUpload={handleFileUpload}
                                saveToNoteVault={saveToNoteVault}
                            />

                            <RedactOutput response={response} />

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <m.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="flex items-center gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-2xl text-red-500"
                                    >
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p className="text-sm font-semibold">{error}</p>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Right: Config + Stats */}
                        <div className="lg:col-span-4 space-y-5">
                            <RedactConfiguration
                                maskingStyle={maskingStyle}
                                setMaskingStyle={setMaskingStyle}
                                keys={keys}
                                setKeys={setKeys}
                                literalTexts={literalTexts}
                                setLiteralTexts={setLiteralTexts}
                                regexPatterns={regexPatterns}
                                setRegexPatterns={setRegexPatterns}
                                onRulesUpload={handleRulesUpload}
                                saveToNoteVault={saveToNoteVault}
                            />
                            <RedactStats response={response} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
