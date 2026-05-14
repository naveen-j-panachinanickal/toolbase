"use client";

import React, { useState, useEffect } from "react";
import {
    Copy,
    Check,
    Trash2,
    Settings2,
    FileCode,
    Terminal,
    AlertCircle,
    Zap,
    RefreshCw,
    ArrowRight,
    Settings,
    Sparkles,
    Cpu,
    Monitor
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { generateModels } from "@/lib/json-to-interface";
import Image from "next/image";
import { appIcons } from "@/config/icons";
import { LazyEditor as Editor } from "@/components/ui/LazyEditor";
import { useTheme } from "next-themes";
import { m, AnimatePresence, Variants } from "framer-motion";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { Switch } from "@/components/ui/Switch";

type Language = 'typescript' | 'python' | 'dart' | 'java' | 'kotlin' | 'swift' | 'go';

const LANGUAGES: TabItem<Language>[] = [
    { id: 'typescript', label: 'TypeScript' },
    { id: 'python', label: 'Python' },
    { id: 'dart', label: 'Dart' },
    { id: 'java', label: 'Java' },
    { id: 'kotlin', label: 'Kotlin' },
    { id: 'swift', label: 'Swift' },
    { id: 'go', label: 'Go' },
];

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
            duration: 0.6, 
            ease: "easeOut",
            staggerChildren: 0.1 
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

export default function JsonToInterfacePage() {
    const [jsonInput, setJsonInput] = useState("");
    const [rootName, setRootName] = useState("Root");
    const [selectedLanguage, setSelectedLanguage] = useState<Language>("typescript");
    const [output, setOutput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [liveMode, setLiveMode] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const { resolvedTheme } = useTheme();

    const handleGenerate = () => {
        if (!jsonInput.trim()) {
            setError("Paste some JSON to begin");
            return;
        }

        setError(null);
        setIsGenerating(true);

        // Artificial delay for premium feel if not live
        const delay = liveMode ? 0 : 400;

        setTimeout(() => {
            try {
                const parsed = JSON.parse(jsonInput);
                const result = generateModels(parsed, {
                    rootName: rootName || "Root",
                    language: selectedLanguage,
                });
                setOutput(result);
                setError(null);
            } catch (err: unknown) {
                let message = "Invalid JSON structure";
                const errorMessage = err instanceof Error ? err.message : "";
                if (errorMessage.includes("at position")) {
                    const position = parseInt(errorMessage.match(/at position (\d+)/)?.[1] || "0");
                    const lines = jsonInput.slice(0, position).split("\n");
                    message = `Syntax error at line ${lines.length}`;
                }
                setError(message);
                if (!liveMode) setOutput("");
            } finally {
                setIsGenerating(false);
            }
        }, delay);
    };

    // Live Mode generation
    useEffect(() => {
        if (liveMode && jsonInput.trim()) {
            handleGenerate();
        }
    }, [jsonInput, selectedLanguage, rootName, liveMode]);

    const handleClear = () => {
        setJsonInput("");
        setOutput("");
        setError(null);
    };

    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <m.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen bg-(--background) text-(--text-primary) p-4 md:p-8 font-display selection:bg-primary/30"
        >
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header Section */}
                {/* Header Section */}
                <m.header 
                    variants={itemVariants}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-(--surface-overlay)/60 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-(--border-subtle) shadow-2xl shadow-black/5 ring-1 ring-white/10"
                >
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                            <m.div 
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-3 shadow-2xl shadow-primary/40"
                            >
                                <Image 
                                    src={appIcons['json-to-interface']} 
                                    alt="JSON to Interface" 
                                    width={64} 
                                    height={64} 
                                    className="w-full h-full brightness-0 invert" 
                                />
                            </m.div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-(--text-primary) leading-none mb-2">
                                JSON to <span className="text-primary">Interface</span>
                            </h1>
                            <div className="flex items-center gap-3">
                                <p className="text-xs text-(--text-tertiary) font-bold uppercase tracking-[0.2em]">Universal Type Generator</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <ReturnToToolsButton />
                    </div>
                </m.header>

                {/* Toolbar Section */}
                <m.div variants={itemVariants} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-(--surface-overlay)/40 backdrop-blur-xl rounded-3xl border border-(--border-subtle) shadow-lg">
                        <div className="flex flex-wrap items-center gap-4">
                            <Tabs
                                tabs={LANGUAGES}
                                value={selectedLanguage}
                                onChange={(l) => setSelectedLanguage(l as Language)}
                                size="sm"
                                colors={{
                                    container: "bg-(--surface) border border-black/10 dark:border-white/10 p-1 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/5",
                                    indicator: "bg-blue-600 shadow-lg shadow-blue-600/40 rounded-xl",
                                    activeBackground: "bg-blue-600",
                                    activeBorder: "border-transparent",
                                    label: {
                                        active: "text-white font-bold",
                                        inactive: "text-(--text-secondary) hover:text-(--text-primary)"
                                    }
                                }}
                            />

                            <div className="hidden md:block w-px h-8 bg-(--border-subtle)" />

                            <div className="flex items-center gap-6 px-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <Switch checked={liveMode} onChange={(e) => setLiveMode(e.target.checked)} />
                                    <div className="flex flex-col leading-none">
                                        <span className="text-sm font-bold text-(--text-primary) group-hover:text-primary transition-colors">Live Mode</span>
                                        <span className="text-[10px] text-(--text-tertiary) uppercase tracking-wider">Auto-Generate</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <Button 
                                variant="ghost"
                                onClick={() => setShowAdvanced(!showAdvanced)} 
                                className={`flex items-center gap-2 h-11 px-4 rounded-2xl transition-all ${showAdvanced ? 'bg-primary/10 text-primary' : 'text-(--text-secondary) hover:bg-(--surface-secondary)'}`}
                            >
                                <Settings2 className={`h-4 w-4 transition-transform duration-500 ${showAdvanced ? 'rotate-180' : ''}`} />
                                <span className="text-sm font-bold uppercase tracking-wide">Options</span>
                            </Button>

                            <AnimatePresence mode="wait">
                                {!liveMode && (
                                    <m.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <m.button
                                            whileHover="hover"
                                            whileTap={{ scale: 0.96 }}
                                            onClick={() => handleGenerate()}
                                            disabled={isGenerating || !jsonInput.trim()}
                                            className="group relative h-11 p-[1.5px] flex items-center justify-center rounded-xl font-bold transition-all duration-500 cursor-pointer overflow-hidden whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {/* Rotating Border Beam */}
                                            <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                                                <m.div
                                                    className="absolute top-1/2 left-1/2 w-[250%] aspect-square -translate-x-1/2 -translate-y-1/2"
                                                    style={{
                                                        background: 'conic-gradient(from 0deg, transparent, var(--primary), transparent 20%, transparent)',
                                                    }}
                                                    animate={{ rotate: [0, 360] }}
                                                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                                />
                                            </div>

                                            {/* Button Body */}
                                            <div className="relative z-10 w-full h-full flex items-center gap-2.5 px-6 rounded-[calc(0.75rem-1.5px)] backdrop-blur-2xl bg-(--surface-overlay) border border-black/15 dark:border-white/10 group-hover:bg-primary/[0.05] transition-all duration-500">
                                                {isGenerating ? (
                                                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                                                ) : (
                                                    <Zap size={16} fill="currentColor" className="text-primary" />
                                                )}
                                                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-(--text-primary) to-(--text-secondary) group-hover:from-primary group-hover:to-blue-400">
                                                    Generate
                                                </span>
                                                <ArrowRight size={14} className="text-primary transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </m.button>
                                    </m.div>
                                )}
                            </AnimatePresence>

                            <Button
                                variant="outline"
                                onClick={handleClear}
                                className="h-11 px-5 bg-transparent text-red-500 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 rounded-2xl font-bold transition-all"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Reset</span>
                            </Button>
                        </div>
                    </div>

                    {/* Advanced Panel */}
                    <AnimatePresence>
                        {showAdvanced && (
                            <m.div 
                                initial={{ height: 0, opacity: 0, y: -20 }} 
                                animate={{ height: 'auto', opacity: 1, y: 0 }} 
                                exit={{ height: 0, opacity: 0, y: -20 }} 
                                className="overflow-hidden"
                            >
                                <Card className="p-8 bg-(--surface-overlay)/60 backdrop-blur-2xl border border-(--border-subtle) rounded-[2rem] shadow-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-primary">
                                                <Cpu className="w-5 h-5" />
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Generation Engine</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="rootName" className="text-[13px] font-bold text-(--text-secondary) ml-1">Root Model Name</Label>
                                                <Input
                                                    id="rootName"
                                                    value={rootName}
                                                    onChange={(e) => setRootName(e.target.value)}
                                                    placeholder="e.g. UserAccount"
                                                    className="h-12 bg-(--surface-secondary) border-(--border-subtle) rounded-2xl px-5 font-bold text-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-emerald-500">
                                                <Monitor className="w-5 h-5" />
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Output Display</h3>
                                            </div>
                                            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                                <p className="text-xs text-emerald-500/80 leading-relaxed font-medium">
                                                    Models are generated using the standard naming conventions for the selected language. 
                                                    Nested objects are automatically extracted into separate models.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </m.div>
                        )}
                    </AnimatePresence>
                </m.div>

                {/* Editor Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-[calc(100vh-320px)] min-h-[600px]">
                    {/* Input Side */}
                    <m.div variants={itemVariants} className="flex flex-col h-full space-y-4 group">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <FileCode size={18} />
                                </div>
                                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-(--text-tertiary)">Source JSON</span>
                            </div>
                            <AnimatePresence>
                                {error && (
                                    <m.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-500"
                                    >
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-bold">{error}</span>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <Card className="flex-1 overflow-hidden border border-(--border-subtle) shadow-2xl bg-(--surface-elevated)/30 backdrop-blur-3xl rounded-[2.5rem] ring-1 ring-white/5 flex flex-col relative transition-all group-hover:border-primary/40 duration-500">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            <Editor
                                height="100%"
                                defaultLanguage="json"
                                theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                                value={jsonInput}
                                onChange={(val) => setJsonInput(val || '')}
                                options={{ 
                                    minimap: { enabled: false }, 
                                    fontSize: 15, 
                                    wordWrap: 'on', 
                                    padding: { top: 32, bottom: 32 },
                                    fontFamily: "'JetBrains Mono', monospace",
                                    lineNumbers: 'on',
                                    renderLineHighlight: 'all',
                                    scrollBeyondLastLine: false,
                                    cursorSmoothCaretAnimation: 'on',
                                    smoothScrolling: true,
                                    bracketPairColorization: { enabled: true }
                                }}
                            />
                        </Card>
                    </m.div>

                    {/* Output Side */}
                    <m.div variants={itemVariants} className="flex flex-col h-full space-y-4 group">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Terminal size={18} />
                                </div>
                                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-500/80">
                                    {LANGUAGES.find(l => l.id === selectedLanguage)?.label} Model
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopy}
                                disabled={!output}
                                className="h-9 px-5 hover:bg-emerald-500/10 text-emerald-500 disabled:opacity-30 rounded-xl font-bold transition-all border border-transparent hover:border-emerald-500/20"
                            >
                                <AnimatePresence mode="wait">
                                    {copied ? (
                                        <m.div 
                                            key="check"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span className="text-xs uppercase tracking-widest">Copied</span>
                                        </m.div>
                                    ) : (
                                        <m.div 
                                            key="copy"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex items-center gap-2"
                                        >
                                            <Copy className="w-4 h-4" />
                                            <span className="text-xs uppercase tracking-widest">Copy Code</span>
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </div>
                        <Card className="flex-1 overflow-hidden border border-(--border-subtle) shadow-2xl bg-[#0d1117] backdrop-blur-3xl rounded-[2.5rem] ring-1 ring-white/10 flex flex-col relative group-hover:border-emerald-500/40 transition-all duration-500">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                            <Editor
                                height="100%"
                                language={selectedLanguage === 'dart' ? 'java' : selectedLanguage}
                                theme="vs-dark"
                                value={output}
                                options={{ 
                                    readOnly: true, 
                                    minimap: { enabled: false }, 
                                    fontSize: 15, 
                                    wordWrap: 'on', 
                                    padding: { top: 32, bottom: 32 },
                                    fontFamily: "'JetBrains Mono', monospace",
                                    scrollBeyondLastLine: false,
                                    lineNumbers: 'on',
                                    cursorSmoothCaretAnimation: 'on',
                                    smoothScrolling: true
                                }}
                            />
                            {!output && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center p-12">
                                        <m.div 
                                            animate={{ 
                                                scale: [1, 1.1, 1],
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{ duration: 6, repeat: Infinity }}
                                            className="relative mb-6"
                                        >
                                            <Sparkles className="h-16 w-16 mx-auto text-white/5" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Sparkles className="h-16 w-16 text-primary blur-2xl opacity-20" />
                                            </div>
                                        </m.div>
                                        <p className="text-sm font-black text-white/20 uppercase tracking-[0.3em]">Awaiting Input</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </m.div>
                </div>
            </div>
        </m.div>
    );
}
