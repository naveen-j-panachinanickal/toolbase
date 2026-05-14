"use client";

import React from "react";
import { Activity, ShieldAlert, CheckCircle2 } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { RedactResponse } from "@/types/redact";

interface RedactStatsProps {
    response: RedactResponse | null;
}

export const RedactStats: React.FC<RedactStatsProps> = ({ response }) => {
    return (
        <AnimatePresence>
            {response && (
                <m.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                >
                    {/* Summary Card */}
                    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-600/5 backdrop-blur-xl overflow-hidden shadow-sm shadow-violet-500/10">
                        <div className="px-5 py-3 border-b border-violet-500/10 bg-violet-500/5 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-violet-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-violet-500">Security Audit</span>
                        </div>
                        
                        <div className="p-6 text-center">
                            <div className="flex items-center justify-center gap-3 mb-1">
                                <m.span 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-4xl font-black text-(--text-primary)"
                                >
                                    {response.summary.totalMasked}
                                </m.span>
                                {response.summary.totalMasked > 0 ? (
                                    <ShieldAlert className="w-6 h-6 text-violet-500 animate-pulse" />
                                ) : (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                )}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-(--text-muted) leading-tight max-w-[150px] mx-auto">
                                Secrets Neutralized
                            </div>
                        </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="space-y-2">
                        <div className="px-1 text-[10px] font-bold uppercase tracking-widest text-(--text-muted) mb-2">
                            Detected Entities
                        </div>
                        {Object.entries(response.summary.byType).map(([type, count], i) => (
                            <m.div
                                key={type}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group flex items-center justify-between px-4 py-3 rounded-xl border border-(--border-subtle) bg-(--surface-overlay) hover:border-violet-500/30 transition-all duration-200"
                            >
                                <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest group-hover:text-violet-500 transition-colors">
                                    {type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs font-black text-(--text-primary) tabular-nums">
                                    {count}
                                </span>
                            </m.div>
                        ))}
                        
                        {Object.keys(response.summary.byType).length === 0 && (
                            <div className="text-center p-8 border border-dashed border-(--border-subtle) rounded-2xl opacity-40 italic text-xs">
                                No sensitive data found
                            </div>
                        )}
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
};
