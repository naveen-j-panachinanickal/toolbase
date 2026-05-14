import React, { useState } from "react";
import { FileUploader } from "@/components/ui/FileUploader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Lock, Unlock, Download, RefreshCw, Eye, EyeOff } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { useTIPTool } from "@/hooks/useTIPTool";


export function Steganography() {
    const [mode, setMode] = useState<"hide" | "reveal">("hide");

    // Hide State
    const [fileToHide, setFileToHide] = useState<File | null>(null);
    const [textToHide, setTextToHide] = useState("");
    const [useEncryption, setUseEncryption] = useState(false);
    const [secretKey, setSecretKey] = useState("");
    const [hiddenResultUrl, setHiddenResultUrl] = useState<string | null>(null);
    const [hiddenPreviewUrl, setHiddenPreviewUrl] = useState<string | null>(null);

    // Reveal State
    const [fileToReveal, setFileToReveal] = useState<File | null>(null);
    const [revealedText, setRevealedText] = useState<string | null>(null);
    const [revealKey, setRevealKey] = useState("");
    const [revealPreviewUrl, setRevealPreviewUrl] = useState<string | null>(null);

    // Hooks
    const hideTool = useTIPTool('pixels/hide-data');
    const revealTool = useTIPTool('pixels/reveal-data');

    const isProcessing = hideTool.isProcessing || revealTool.isProcessing;

    const handleFileSelect = async (file: File | null, type: "hide" | "reveal") => {
        if (!file) return;

        if (type === "hide") {
            setFileToHide(file);
            setHiddenPreviewUrl(URL.createObjectURL(file));
            setHiddenResultUrl(null);
        } else {
            setFileToReveal(file);
            setRevealPreviewUrl(URL.createObjectURL(file));
            setRevealedText(null);
        }
    };

    const handleHide = async () => {
        if (!fileToHide || !textToHide) return;
        try {
            const config = {
                message: textToHide,
                key: useEncryption ? secretKey : ""
            };
            const resultFiles = await hideTool.execute([fileToHide], config);

            if (resultFiles && resultFiles.length > 0) {
                const blob = resultFiles[0];
                const url = URL.createObjectURL(blob);
                setHiddenResultUrl(url);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleReveal = async () => {
        if (!fileToReveal) return;
        try {
            const config = {
                key: revealKey || ""
            };
            const resultFiles = await revealTool.execute([fileToReveal], config);

            if (resultFiles && resultFiles.length > 0) {
                // The TIP bundle returns a text blob
                const text = await resultFiles[0].text();
                setRevealedText(text);
            }
        } catch (error) {
            console.error(error);
            setRevealedText("Error revealing text.");
        }
    };

    const downloadImage = () => {
        if (!hiddenResultUrl) return;
        const link = document.createElement('a');
        link.href = hiddenResultUrl;
        link.download = `steganography-image.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const tabs = [
        { id: "hide", label: "Hide Message", icon: <Lock className="w-4 h-4" /> },
        { id: "reveal", label: "Reveal Message", icon: <Unlock className="w-4 h-4" /> },
    ];

    const tabColors = {
        container: "bg-[var(--surface-secondary)] border border-[color:var(--border-subtle)] p-1.5 shadow-inner",
        indicator: "bg-primary shadow-md shadow-primary/20",
        activeBackground: "bg-primary",
        label: {
            active: "text-white font-bold tracking-wide",
            inactive: "text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] font-medium",
            onHoverColor: "hover:text-[color:var(--text-primary)]"
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 p-1">
            <div className="flex justify-center mb-4">
                <Tabs
                    tabs={tabs}
                    value={mode}
                    onChange={(id) => setMode(id as "hide" | "reveal")}
                    colors={tabColors}
                />
            </div>

            <AnimatePresence mode="wait">
                {mode === "hide" ? (
                    <m.div
                        key="hide"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full"
                    >
                        {/* Input Side */}
                        <div className="space-y-6">
                            <Card className="bg-[var(--surface-elevated)] border-[color:var(--border-medium)]">
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="font-bold text-[color:var(--text-primary)]">1. Select Image</h3>
                                    <div className={cn("min-h-[200px] flex flex-col items-center justify-center overflow-hidden relative w-full", hiddenPreviewUrl ? "bg-[var(--surface-secondary)] rounded-2xl border border-[var(--border-subtle)]" : "")}>
                                        {hiddenPreviewUrl ? (
                                            <>
                                                <img src={hiddenPreviewUrl} className="absolute inset-0 w-full h-full object-contain p-4" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer backdrop-blur-sm" onClick={() => { setFileToHide(null); setHiddenPreviewUrl(null); }}>
                                                    <RefreshCw className="text-white w-8 h-8" />
                                                </div>
                                            </>
                                        ) : (
                                            <FileUploader
                                                onFilesSelected={(files) => handleFileSelect(files.length > 0 ? files[0] : null, "hide")}
                                                accept="image/*"
                                                multiple={false}
                                                className="h-full w-full border-0"
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[var(--surface-elevated)] border-[color:var(--border-medium)]">
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="font-bold text-[color:var(--text-primary)]">2. Enter Secret Message</h3>
                                    <textarea
                                        value={textToHide}
                                        onChange={(e) => setTextToHide(e.target.value)}
                                        placeholder="Type your secret message here..."
                                        className="w-full h-32 p-4 rounded-xl border border-[color:var(--border-medium)] bg-[var(--surface-secondary)] text-[color:var(--text-primary)] placeholder-[color:var(--text-faint)] focus:bg-[var(--surface-overlay)] focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-[color:var(--text-muted)]">
                                            {textToHide.length} characters
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <div className="relative">
                                                <input type="checkbox" className="sr-only" checked={useEncryption} onChange={(e) => setUseEncryption(e.target.checked)} />
                                                <div className={`w-10 h-6 rounded-full shadow-inner transition-colors ${useEncryption ? 'bg-primary' : 'bg-[var(--surface-secondary)] border border-[color:var(--border-medium)]'}`}></div>
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow transition-transform ${useEncryption ? 'translate-x-4 bg-white' : 'bg-[color:var(--text-muted)]'}`}></div>
                                            </div>
                                            <span className="text-sm font-medium text-[color:var(--text-primary)]">Encrypt with Key</span>
                                        </label>
                                    </div>

                                    <AnimatePresence>
                                        {useEncryption && (
                                            <m.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <input
                                                    type="password"
                                                    value={secretKey}
                                                    onChange={(e) => setSecretKey(e.target.value)}
                                                    placeholder="Enter secret key..."
                                                    className="w-full p-3 rounded-xl border border-[color:var(--border-medium)] bg-[var(--surface-secondary)] text-[color:var(--text-primary)] placeholder-[color:var(--text-faint)] focus:bg-[var(--surface-overlay)] focus:ring-2 focus:ring-primary outline-none transition-all mt-4"
                                                />
                                            </m.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>

                            <Button
                                onClick={handleHide}
                                disabled={!fileToHide || !textToHide || isProcessing || (useEncryption && !secretKey)}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed border-0 font-bold"
                            >
                                {isProcessing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Encoding...</span>
                                    </div>
                                ) : (
                                    "Hide Data & Download"
                                )}
                            </Button>
                        </div>

                        {/* Output Side */}
                        <div className="space-y-6 flex flex-col">
                            {hiddenResultUrl ? (
                                <Card className="flex-1 bg-emerald-500/10 border border-emerald-500/20">
                                    <CardContent className="p-6 h-full flex flex-col items-center justify-center space-y-6">
                                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10 border border-emerald-500/30">
                                            <Lock className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-emerald-500 drop-shadow-sm">Data Hidden!</h3>
                                        <p className="text-emerald-500/80 text-center max-w-xs font-medium">
                                            Your image now contains the secret data. It looks identical to the original.
                                        </p>

                                        <div className="w-full max-w-sm bg-[var(--surface-elevated)] p-2 rounded-2xl shadow-sm border border-[color:var(--border-subtle)] mt-4">
                                            <img src={hiddenResultUrl} className="w-full rounded-xl object-contain h-64" alt="Result" />
                                        </div>

                                        <Button
                                            onClick={downloadImage}
                                            className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-12 shadow-lg shadow-emerald-500/20 border-0"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Encoded Image
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="flex-1 border-2 border-dashed border-[color:var(--border-medium)] bg-[var(--surface-secondary)] rounded-[24px] flex items-center justify-center text-[color:var(--text-muted)]">
                                    <div className="text-center">
                                        <EyeOff className="w-12 h-12 mx-auto mb-2 text-[color:var(--border-medium)]" />
                                        <p className="font-medium text-[color:var(--text-faint)]">Output will appear here</p>
                                    </div>
                                </div>
                            )}
                        </div>

                    </m.div>
                ) : (
                    <m.div
                        key="reveal"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-2xl mx-auto space-y-8"
                    >
                        <Card className="bg-[var(--surface-elevated)] border-[color:var(--border-medium)]">
                            <CardContent className="p-8 space-y-6">
                                <h3 className="text-center font-bold text-[color:var(--text-primary)] text-xl">Upload Image to Reveal Message</h3>
                                <div className={cn("min-h-[300px] flex flex-col items-center justify-center overflow-hidden relative group w-full", revealPreviewUrl ? "bg-[var(--surface-secondary)] rounded-3xl border border-[var(--border-subtle)]" : "")}>
                                    {revealPreviewUrl ? (
                                        <>
                                            <img src={revealPreviewUrl} className="absolute inset-0 w-full h-full object-contain p-4 transition-opacity group-hover:opacity-30" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                <Button onClick={() => { setFileToReveal(null); setRevealPreviewUrl(null); setRevealedText(null); }} className="bg-white text-black hover:bg-gray-100 font-bold border-0">
                                                    Change Image
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <FileUploader
                                            onFilesSelected={(files) => handleFileSelect(files.length > 0 ? files[0] : null, "reveal")}
                                            accept="image/*"
                                            multiple={false}
                                            className="h-full w-full border-0"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[color:var(--text-primary)]">Decryption Key (Optional)</label>
                                    <input
                                        type="password"
                                        value={revealKey}
                                        onChange={(e) => setRevealKey(e.target.value)}
                                        placeholder="Enter key if message is encrypted..."
                                        className="w-full p-3 rounded-xl border border-[color:var(--border-medium)] bg-[var(--surface-secondary)] text-[color:var(--text-primary)] placeholder-[color:var(--text-faint)] focus:bg-[var(--surface-overlay)] focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                    />
                                </div>

                                <Button
                                    onClick={handleReveal}
                                    disabled={!fileToReveal || isProcessing}
                                    className="w-full h-14 text-lg bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-900/20 disabled:opacity-50 disabled:cursor-not-allowed border-0"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Decoding...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Unlock className="w-5 h-5 mr-2" />
                                            Reveal Hidden Data
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {revealedText && (
                            <m.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "rounded-3xl p-8 shadow-xl border ring-4 transition-all duration-300",
                                    revealedText.startsWith("ERROR:") || revealedText.startsWith("Error")
                                        ? "bg-red-500/10 border-red-500/20 ring-red-500/10 backdrop-blur-xl"
                                        : "bg-[var(--surface-elevated)] border-violet-500/20 ring-violet-500/10 backdrop-blur-xl"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center gap-3 mb-4",
                                    revealedText.startsWith("ERROR:") || revealedText.startsWith("Error")
                                        ? "text-red-500"
                                        : "text-violet-400"
                                )}>
                                    {revealedText.startsWith("ERROR:") || revealedText.startsWith("Error") ? (
                                        <Lock className="w-6 h-6" />
                                    ) : (
                                        <Eye className="w-6 h-6" />
                                    )}
                                    <h3 className="font-bold text-lg">
                                        {revealedText.startsWith("ERROR:") || revealedText.startsWith("Error")
                                            ? "Access Denied / Error"
                                            : "Decoded Data"
                                        }
                                    </h3>
                                </div>
                                <div className={cn(
                                    "p-6 rounded-2xl border font-mono whitespace-pre-wrap break-all min-h-[100px]",
                                    revealedText.startsWith("ERROR:") || revealedText.startsWith("Error")
                                        ? "bg-red-500/10 border-red-500/20 text-red-500 shadow-inner"
                                        : "bg-[var(--surface-overlay)] border-[color:var(--border-subtle)] text-[color:var(--text-primary)] shadow-inner"
                                )}>
                                    {revealedText}
                                </div>
                            </m.div>
                        )}
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
