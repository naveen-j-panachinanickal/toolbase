"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
    RefreshCw, 
    CheckCircle2, 
    Lock, 
    Shield, 
    Copy, 
    Zap, 
    ShieldCheck, 
    ShieldAlert,
    ChevronRight,
    Binary
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";
import { Slider } from "@/components/ui/Slider";
import { Checkbox } from "@/components/ui/Checkbox";

/* ── Components ──────────────────────────────────────────────────────────── */

/**
 * A premium strength indicator with descriptive feedback.
 */
const StrengthMeter = ({ strength }: { strength: number }) => {
    const levels = [
        { label: "Critical", color: "bg-red-500", text: "text-red-500", icon: ShieldAlert },
        { label: "Insecure", color: "bg-orange-500", text: "text-orange-500", icon: ShieldAlert },
        { label: "Acceptable", color: "bg-yellow-500", text: "text-yellow-500", icon: ShieldCheck },
        { label: "Secure", color: "bg-blue-500", text: "text-blue-500", icon: ShieldCheck },
        { label: "Impenetrable", color: "bg-emerald-500", text: "text-emerald-500", icon: ShieldCheck },
    ];

    const current = levels[Math.min(strength, levels.length - 1)];
    const Icon = current.icon;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={cn("w-3.5 h-3.5", current.text)} />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-(--text-muted)">
                        Security Audit
                    </span>
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-widest", current.text)}>
                    {current.label}
                </span>
            </div>
            <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                    <m.div
                        key={i}
                        className="flex-1 h-1.5 rounded-full bg-(--surface-active)"
                        initial={false}
                    >
                        {i <= strength && (
                            <m.div
                                layoutId="strength-bar"
                                className={cn("h-full rounded-full", current.color)}
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            />
                        )}
                    </m.div>
                ))}
            </div>
        </div>
    );
};

export default function PasswordXPage() {
    // State
    const [password, setPassword] = useState("");
    const [length, setLength] = useState(24);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [strength, setStrength] = useState(0);
    const [showToast, setShowToast] = useState(false);

    // Character Sets
    const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    const NUMBERS = "0123456789";
    const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    const generatePassword = useCallback(() => {
        let chars = "";
        if (includeUppercase) chars += UPPERCASE;
        if (includeLowercase) chars += LOWERCASE;
        if (includeNumbers) chars += NUMBERS;
        if (includeSymbols) chars += SYMBOLS;

        if (chars === "") {
            setPassword("");
            setStrength(0);
            return;
        }

        let generated = "";
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            generated += chars[array[i] % chars.length];
        }

        setPassword(generated);
        
        // Advanced Strength Calculation (0-4)
        let points = 0;
        if (length >= 12) points += 1;
        if (length >= 24) points += 1;
        
        const hasUpper = /[A-Z]/.test(generated);
        const hasNumber = /[0-9]/.test(generated);
        const hasSymbol = /[^A-Za-z0-9]/.test(generated);
        
        const complexity = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
        if (complexity >= 2) points += 1;
        if (complexity >= 3) points += 1;

        setStrength(Math.min(points, 4));
    }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

    const copyToClipboard = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    // Generate on load
    useEffect(() => {
        generatePassword();
    }, []);

    return (
        <div className="min-h-screen bg-(--background) text-(--text-primary) font-display overflow-x-hidden">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
                
                {/* ── Header ─────────────────────────────────────────── */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">PasswordX</h1>
                            <p className="text-[11px] text-(--text-muted)">
                                Cryptographically secure · zero-knowledge · browser-only
                            </p>
                        </div>
                    </div>
                    <ReturnToToolsButton />
                </header>

                {/* ── Main Vault ─────────────────────────────────────── */}
                <div className="space-y-8">
                    
                    {/* Password Display Card */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                        <div className="relative flex flex-col rounded-[2rem] border border-(--border-medium) bg-(--surface-overlay)/80 backdrop-blur-3xl overflow-hidden shadow-2xl">
                            
                            <div className="p-8 md:p-12 space-y-8">
                                {/* The Vaulted Text */}
                                <div className="relative min-h-[120px] flex items-center justify-center py-4 px-6 bg-(--surface-secondary)/30 rounded-2xl border border-(--border-subtle) overflow-hidden group/pass">
                                    <AnimatePresence mode="wait">
                                        <m.div
                                            key={password}
                                            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
                                            className="font-mono text-2xl md:text-4xl lg:text-5xl font-medium tracking-tight text-center break-all select-all selection:bg-indigo-500/30"
                                        >
                                            {password}
                                        </m.div>
                                    </AnimatePresence>

                                    {/* Action Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-(--surface-overlay) via-transparent to-transparent opacity-0 group-hover/pass:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 pointer-events-none">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 drop-shadow-sm">
                                            Vault Securely Encrypted
                                        </span>
                                    </div>
                                </div>

                                {/* Action Hub */}
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <Button
                                        onClick={copyToClipboard}
                                        className="h-16 pl-8 pr-10 rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-600 to-violet-600 hover:from-indigo-600 hover:via-blue-700 hover:to-violet-700 text-white shadow-2xl shadow-indigo-500/30 font-black text-lg transition-all active:scale-95 group/copy relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/copy:opacity-100 transition-opacity duration-300" />
                                        <Copy className="w-6 h-6 mr-3 group-hover/copy:scale-110 transition-transform" />
                                        Copy Password
                                    </Button>

                                    <Button
                                        onClick={generatePassword}
                                        variant="outline"
                                        className="h-16 px-8 rounded-2xl border-(--border-medium) bg-(--surface-secondary) text-(--text-primary) hover:bg-(--surface-hover) font-bold text-lg transition-all active:scale-95"
                                    >
                                        <RefreshCw className="w-5 h-5 mr-3" />
                                        Regenerate
                                    </Button>
                                </div>

                                <AnimatePresence>
                                    {showToast && (
                                        <m.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white shadow-lg text-xs font-bold"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Copied to clipboard
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Strength Footer */}
                            <div className="px-8 py-6 bg-(--surface-secondary)/50 border-t border-(--border-subtle)">
                                <StrengthMeter strength={strength} />
                            </div>
                        </div>
                    </div>

                    {/* ── Configuration ──────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Length Settings */}
                        <div className="space-y-6 p-8 rounded-[2rem] border border-(--border-medium) bg-(--surface-overlay) shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Binary className="w-4 h-4 text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-(--text-muted)">
                                        Character Count
                                    </span>
                                </div>
                                <span className="text-2xl font-black text-indigo-500 tabular-nums">
                                    {length}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <Slider
                                    min={8}
                                    max={64}
                                    step={1}
                                    value={length}
                                    onChange={(e) => setLength(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-(--text-muted) opacity-40">
                                    <span>8 chars</span>
                                    <span>64 chars</span>
                                </div>
                            </div>
                        </div>

                        {/* Composition Settings */}
                        <div className="space-y-6 p-8 rounded-[2rem] border border-(--border-medium) bg-(--surface-overlay) shadow-sm">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-(--text-muted)">
                                    Composition
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { checked: includeUppercase, onChange: setIncludeUppercase, label: "A-Z", sub: "Uppercase" },
                                    { checked: includeLowercase, onChange: setIncludeLowercase, label: "a-z", sub: "Lowercase" },
                                    { checked: includeNumbers, onChange: setIncludeNumbers, label: "0-9", sub: "Digits" },
                                    { checked: includeSymbols, onChange: setIncludeSymbols, label: "#$!", sub: "Symbols" }
                                ].map((opt, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => opt.onChange(!opt.checked)}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col gap-1",
                                            opt.checked 
                                                ? "bg-indigo-500/5 border-indigo-500/30 ring-1 ring-indigo-500/10" 
                                                : "bg-(--surface-active)/30 border-(--border-subtle) grayscale opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-black">{opt.label}</span>
                                            <div className={cn(
                                                "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                                                opt.checked ? "bg-indigo-500 border-indigo-500" : "border-(--border-medium)"
                                            )}>
                                                {opt.checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-(--text-muted)">{opt.sub}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-center gap-2 px-6 py-4 bg-(--surface-secondary)/30 border border-(--border-subtle) rounded-2xl mx-auto max-w-fit">
                        <Shield className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black text-(--text-muted) uppercase tracking-[0.12em]">
                            Entropy generated via Crypto.getRandomValues() · 100% Client-Side
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
