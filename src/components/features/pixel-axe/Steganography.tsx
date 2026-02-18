
import React, { useState } from "react";
import { FileDropZone } from "@/components/ui/FileDropZone";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Lock, Unlock, Download, RefreshCw, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SteganographyProps {
    hideText: (file: File, text: string, key?: string) => Promise<any>;
    revealText: (file: File, key?: string) => Promise<any>;
    getImageInfo: (file: File) => Promise<any>;
    isProcessing: boolean;
    isReady: boolean;
}

export function Steganography({
    hideText,
    revealText,
    getImageInfo,
    isProcessing,
    isReady
}: SteganographyProps) {
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
            const result = await hideText(fileToHide, textToHide, useEncryption ? secretKey : undefined);
            // Result is bytes (image)
            const blob = new Blob([result], { type: "image/png" });
            const url = URL.createObjectURL(blob);
            setHiddenResultUrl(url);
        } catch (error) {
            console.error(error);
        }
    };

    const handleReveal = async () => {
        if (!fileToReveal) return;
        try {
            const result = await revealText(fileToReveal, revealKey || undefined);
            // Result is string
            setRevealedText(result);
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

    const tabColors = mode === "hide"
        ? {
            container: "bg-blue-50/50 border border-blue-100 p-1.5",
            indicator: "bg-blue-600 shadow-md",
            activeBackground: "bg-white",
            label: {
                active: "text-blue font-semibold",
                inactive: "text-blue-500 hover:text-blue-700",
                onHoverColor: "hover:text-blue-700"
            }
        }
        : {
            container: "bg-violet-50/50 border border-violet-100 p-1.5",
            indicator: "bg-violet-600 shadow-md",
            activeBackground: "bg-white",
            label: {
                active: "text-violet font-semibold",
                inactive: "text-violet-500 hover:text-violet-700",
                onHoverColor: "hover:text-violet-700"
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
                    <motion.div
                        key="hide"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full"
                    >
                        {/* Input Side */}
                        <div className="space-y-6">
                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="font-bold text-gray-700">1. Select Image</h3>
                                    <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 min-h-[200px] flex flex-col items-center justify-center overflow-hidden relative">
                                        {hiddenPreviewUrl ? (
                                            <>
                                                <img src={hiddenPreviewUrl} className="absolute inset-0 w-full h-full object-contain p-4" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/10 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer" onClick={() => { setFileToHide(null); setHiddenPreviewUrl(null); }}>
                                                    <RefreshCw className="text-white w-8 h-8" />
                                                </div>
                                            </>
                                        ) : (
                                            <FileDropZone
                                                onFileSelected={(files) => handleFileSelect(files, "hide")}
                                                accept="image/*"
                                                className="border-0 h-full w-full"
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="font-bold text-gray-700">2. Enter Secret Message</h3>
                                    <textarea
                                        value={textToHide}
                                        onChange={(e) => setTextToHide(e.target.value)}
                                        placeholder="Type your secret message here..."
                                        className="w-full h-32 p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-400">
                                            {textToHide.length} characters
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <div className="relative">
                                                <input type="checkbox" className="sr-only" checked={useEncryption} onChange={(e) => setUseEncryption(e.target.checked)} />
                                                <div className={`w-10 h-6 rounded-full shadow-inner transition-colors ${useEncryption ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${useEncryption ? 'translate-x-4' : ''}`}></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">Encrypt with Key</span>
                                        </label>
                                    </div>

                                    <AnimatePresence>
                                        {useEncryption && (
                                            <motion.div
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
                                                    className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>

                            <Button
                                onClick={handleHide}
                                disabled={!fileToHide || !textToHide || isProcessing || (useEncryption && !secretKey)}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <Card className="flex-1 border-emerald-100 bg-emerald-50/30">
                                    <CardContent className="p-6 h-full flex flex-col items-center justify-center space-y-6">
                                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                            <Lock className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-emerald-900">Data Hidden!</h3>
                                        <p className="text-emerald-700 text-center max-w-xs">
                                            Your image now contains the secret data. It looks identical to the original.
                                        </p>

                                        <div className="w-full max-w-sm bg-white p-2 rounded-2xl shadow-sm border border-emerald-100 mt-4">
                                            <img src={hiddenResultUrl} className="w-full rounded-xl object-contain h-64" alt="Result" />
                                        </div>

                                        <Button
                                            onClick={downloadImage}
                                            className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 shadow-lg shadow-emerald-900/20"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Encoded Image
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="flex-1 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center text-gray-300">
                                    <div className="text-center">
                                        <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>Output will appear here</p>
                                    </div>
                                </div>
                            )}
                        </div>

                    </motion.div>
                ) : (
                    <motion.div
                        key="reveal"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-2xl mx-auto space-y-8"
                    >
                        <Card>
                            <CardContent className="p-8 space-y-6">
                                <h3 className="text-center font-bold text-gray-700 text-xl">Upload Image to Reveal Message</h3>
                                <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 min-h-[300px] flex flex-col items-center justify-center overflow-hidden relative group">
                                    {revealPreviewUrl ? (
                                        <>
                                            <img src={revealPreviewUrl} className="absolute inset-0 w-full h-full object-contain p-4 transition-opacity group-hover:opacity-50" alt="Preview" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button onClick={() => { setFileToReveal(null); setRevealPreviewUrl(null); setRevealedText(null); }} variant="outline" className="bg-white">
                                                    Change Image
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <FileDropZone
                                            onFileSelected={(files) => handleFileSelect(files, "reveal")}
                                            accept="image/*"
                                            className="border-0 h-full w-full"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Decryption Key (Optional)</label>
                                    <input
                                        type="password"
                                        value={revealKey}
                                        onChange={(e) => setRevealKey(e.target.value)}
                                        placeholder="Enter key if message is encrypted..."
                                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                    />
                                </div>

                                <Button
                                    onClick={handleReveal}
                                    disabled={!fileToReveal || isProcessing}
                                    className="w-full h-14 text-lg bg-violet-600 hover:bg-violet-700 text-white rounded-2xl shadow-lg shadow-violet-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "rounded-3xl p-8 shadow-xl border ring-4 transition-all duration-300",
                                    revealedText.startsWith("ERROR:") || revealedText.startsWith("Error")
                                        ? "bg-red-50 border-red-200 ring-red-100"
                                        : "bg-white border-violet-100 ring-violet-50"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center gap-3 mb-4",
                                    revealedText.startsWith("ERROR:") || revealedText.startsWith("Error")
                                        ? "text-red-600"
                                        : "text-violet-600"
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
                                        ? "bg-red-100/50 border-red-200 text-red-800"
                                        : "bg-slate-50 border-slate-100 text-slate-700"
                                )}>
                                    {revealedText}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
