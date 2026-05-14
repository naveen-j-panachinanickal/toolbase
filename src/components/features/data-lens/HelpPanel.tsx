"use client";

import React from "react";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HelpExample {
    title: string;
    description: string;
    code: string;
}

interface HelpPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    introduction?: React.ReactNode;
    examples: HelpExample[];
}

export function HelpPanel({ isOpen, onClose, title, introduction, examples }: HelpPanelProps) {
    const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

    const handleCopy = (code: string, index: number) => {
        navigator.clipboard.writeText(code);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop for focus */}
            <div 
                className="absolute inset-0 bg-background/50 backdrop-blur-sm z-40 animate-in fade-in duration-500"
                onClick={onClose}
            />
            
            <div className="absolute inset-y-0 right-0 w-85 bg-surface border-l border-border-subtle shadow-[-20px_0_50px_rgba(0,0,0,0.3)] z-50 flex flex-col animate-in slide-in-from-right duration-500 ease-in-out">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle bg-surface">
                    <div className="flex flex-col">
                        <span className="font-bold text-text-primary text-lg tracking-tight">{title}</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Documentation & Examples</span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-surface-overlay rounded-xl transition-all text-text-muted hover:text-text-primary hover:rotate-90 duration-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {introduction && (
                        <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                            {introduction}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 px-1">
                            <div className="h-px flex-1 bg-border-subtle"></div>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Examples</span>
                            <div className="h-px flex-1 bg-border-subtle"></div>
                        </div>
                        
                        {examples.map((example, idx) => (
                            <div key={idx} className="space-y-3 group">
                                <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors uppercase tracking-tight">{example.title}</h4>
                                <p className="text-xs text-text-secondary leading-relaxed">{example.description}</p>
                                <div className="relative">
                                    <pre className="bg-surface-secondary text-text-primary p-4 rounded-2xl text-[11px] font-mono overflow-x-auto border border-border-medium shadow-sm transition-all group-hover:border-primary/50 group-hover:bg-surface group-hover:shadow-md">
                                        {example.code}
                                    </pre>
                                    <button
                                        onClick={() => handleCopy(example.code, idx)}
                                        className="absolute top-3 right-3 p-2 bg-surface/80 hover:bg-surface rounded-xl text-text-muted hover:text-primary shadow-sm border border-border-medium transition-all opacity-0 group-hover:opacity-100"
                                        title="Copy to clipboard"
                                    >
                                        {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-surface-secondary border-t border-border-subtle">
                    <div className="flex items-center gap-3 text-primary">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs">💡</span>
                        </div>
                        <p className="text-[11px] font-medium leading-tight">
                            Table names are automatically derived from your uploaded filenames!
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
