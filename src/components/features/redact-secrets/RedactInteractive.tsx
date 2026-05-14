"use client";

import React, { useEffect, useState } from "react";
import { Shield, CheckCircle, X, ShieldAlert, Zap } from "lucide-react";
import { useRedactSecrets } from "@/hooks/useRedactSecrets";
import { RedactEditor } from "./RedactEditor";
import { RedactConfiguration } from "./RedactConfiguration";
import { RedactOutput } from "./RedactOutput";
import { RedactStats } from "./RedactStats";
import { EngineLoader } from "@/components/ui/EngineLoader";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TIPInteractionProps } from "@/tip/protocol";
import type { ContentType, MaskingStyle } from "@/types/redact";

/**
 * TIP Interaction Component for Redact Secrets.
 * Reuses the redesigned UI components for a consistent experience
 * inside the pipeline configuration modal.
 */
export default function RedactInteractive({
    files: seedFiles,
    config: seedConfig,
    onConfirm,
    onCancel,
}: TIPInteractionProps) {
    const [isInternalReading, setIsInternalReading] = useState(false);

    const {
        content, setContent,
        contentType, setContentType,
        fileName, setFileName,
        maskingStyle, setMaskingStyle,
        keys, setKeys,
        literalTexts, setLiteralTexts,
        regexPatterns, setRegexPatterns,
        response, isLoading, isReady,
        handleRedact, handleRulesUpload, saveToNoteVault
    } = useRedactSecrets({
        content: (seedConfig?.content as string) || "",
        contentType: (seedConfig?.contentType as ContentType) || "text",
        fileName: (seedConfig?.fileName as string) || null,
        maskingStyle: (seedConfig?.maskingStyle as MaskingStyle) || "partial",
        keys: (seedConfig?.keys as string[]) || [],
        literalTexts: (seedConfig?.literalTexts as string[]) || [],
        regexPatterns: (seedConfig?.regexPatterns as string[]) || [],
    });

    useEffect(() => {
        if (seedFiles && seedFiles.length > 0 && !content) {
            const file = seedFiles[0];
            setIsInternalReading(true);
            setFileName(file.name);
            setContentType("file");

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result === "string") {
                    setContent(result);
                }
                setIsInternalReading(false);
            };
            reader.onerror = () => setIsInternalReading(false);
            reader.readAsText(file);
        }
    }, [seedFiles, content, setContent, setFileName, setContentType]);

    const handleConfirm = () => {
        let finalFile: File;
        if (seedFiles && seedFiles.length > 0) {
            finalFile = seedFiles[0];
        } else {
            const blob = new Blob([content], { type: "text/plain" });
            finalFile = new File([blob], fileName || "redacted.txt", { type: "text/plain" });
        }

        onConfirm({
            files: [finalFile],
            config: {
                content, contentType, fileName, maskingStyle, keys, literalTexts, regexPatterns,
            },
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-(--background) text-(--text-primary) font-display p-6 space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Configure Redaction</h2>
                        <p className="text-[11px] text-(--text-muted)">Preview and adjust masking patterns</p>
                    </div>
                </div>
                <EngineLoader isReady={isReady} engine="wasm" />
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
                    <div className="lg:col-span-8 space-y-6">
                        <RedactEditor
                            content={content}
                            setContent={setContent}
                            contentType={contentType}
                            setContentType={setContentType}
                            fileName={fileName}
                            onFileUpload={() => {}} // Disabled in modal for now
                            saveToNoteVault={saveToNoteVault}
                        />

                        <AnimatePresence mode="wait">
                            {response ? (
                                <RedactOutput response={response} />
                            ) : !isLoading && !isInternalReading && (
                                <m.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-12 border-2 border-dashed border-(--border-subtle) rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-(--surface-secondary)/20"
                                >
                                    <div className="w-12 h-12 rounded-full bg-(--surface-active) flex items-center justify-center text-(--text-muted)/50">
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-(--text-muted)">Awaiting Preview</h3>
                                        <p className="text-[11px] text-(--text-muted) mt-1 max-w-[240px] mx-auto">
                                            Run a preview to verify your masking rules.
                                        </p>
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
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

            {/* Footer */}
            <footer className="flex items-center justify-between pt-6 border-t border-(--border-subtle) shrink-0">
                <button
                    onClick={handleRedact}
                    disabled={isLoading || isInternalReading || !content}
                    className="group inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-(--border-medium) bg-(--surface-secondary) text-sm font-bold text-(--text-primary) hover:bg-(--surface-hover) transition-all active:scale-95 disabled:opacity-40"
                >
                    <Zap className={cn("w-4 h-4 text-violet-500 transition-transform group-hover:scale-110", isLoading && "animate-pulse")} />
                    Run Preview
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        className="h-11 px-5 rounded-xl text-xs font-bold uppercase tracking-widest text-(--text-muted) hover:text-(--text-primary) transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!content || isLoading || isInternalReading}
                        className="inline-flex items-center gap-2 h-11 px-8 rounded-xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-40"
                        style={{
                            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                            boxShadow: "0 2px 10px rgba(139,92,246,0.3)",
                        }}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                    </button>
                </div>
            </footer>
        </div>
    );
}
