"use client";

import React, { useState } from "react";
import { Copy, Check, ShieldCheck, Download } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { RedactResponse } from "@/types/redact";

interface RedactOutputProps {
    response: RedactResponse | null;
}

export const RedactOutput: React.FC<RedactOutputProps> = ({ response }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (!response?.maskedContent) return;
        navigator.clipboard.writeText(response.maskedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadOutput = () => {
        if (!response?.maskedContent) return;
        const blob = new Blob([response.maskedContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `redacted_${new Date().getTime()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AnimatePresence mode="wait">
            {response && (
                <m.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex flex-col rounded-2xl border border-emerald-500/20 bg-(--surface-overlay) backdrop-blur-xl overflow-hidden shadow-lg shadow-emerald-500/5"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/10 bg-emerald-500/5">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Protected Output</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={downloadOutput}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-active) transition-all"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </button>
                            <button
                                onClick={copyToClipboard}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all active:scale-95"
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied!" : "Copy Text"}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 bg-gray-950/40 dark:bg-black/20 min-h-[250px] max-h-[500px] overflow-y-auto relative group custom-scrollbar">
                        <pre className="whitespace-pre-wrap font-mono text-xs text-(--text-primary) leading-relaxed selection:bg-emerald-500/20">
                            {response.maskedContent}
                        </pre>
                        
                        {/* Status bar */}
                        <div className="mt-8 flex items-center justify-between pt-4 border-t border-(--border-subtle) opacity-40">
                            <span className="text-[10px] font-mono tracking-tight">Redaction Complete</span>
                            <span className="text-[10px] font-mono tracking-tight">Verified Secure</span>
                        </div>
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
};
