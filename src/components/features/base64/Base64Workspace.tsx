'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBase64 } from '@/hooks/useBase64Worker';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { FileDropZone } from '@/components/ui/FileDropZone';
import { CopyToClipboard } from '@/components/ui/CopyToClipboard';
import { LazyEditor as Editor } from "@/components/ui/LazyEditor";
import {
    FileText,
    FileCode,
    AlertCircle,
    Download,
    ArrowRight,
    Sparkles,
    Settings,
    Eye,
    RefreshCw,
    Zap,
    Lock,
    ShieldCheck,
    Cpu,
    Upload
} from 'lucide-react';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import type { Base64Mode, Base64Response } from '@/types/base64';
import { m, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

export interface Base64WorkspaceProps {
    initialFile?: File | null;
    initialMode?: 'text' | 'file';
    initialOperation?: 'encode' | 'decode';
    initialContent?: string;
    showControls?: boolean;
    onResultUpdate?: (result: Base64Response) => void;
}

export function Base64Workspace({
    initialFile = null,
    initialMode = 'text',
    initialOperation = 'encode',
    initialContent = '',
    showControls = true,
    onResultUpdate,
}: Base64WorkspaceProps) {
    const {
        process,
        isReady,
        isProcessing,
        result,
        previewText,
        isLargeFile,
        error,
        downloadResult,
        reset,
    } = useBase64();
    const { resolvedTheme } = useTheme();

    // UI State
    const [mode, setMode] = useState<'text' | 'file'>(initialMode);
    const [operation, setOperation] = useState<'encode' | 'decode'>(initialOperation);
    const [inputText, setInputText] = useState(initialContent);
    const [imagePreview, setImagePreview] = useState<string | null>(() => (
        initialFile?.type.startsWith('image/') ? URL.createObjectURL(initialFile) : null
    ));
    const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);

    // Decoded Previews
    const [decodedImageUrl, setDecodedImageUrl] = useState<string | null>(null);
    const [decodedPdfUrl, setDecodedPdfUrl] = useState<string | null>(null);
    const [detectedLanguage, setDetectedLanguage] = useState<'text' | 'json' | 'xml' | 'markdown' | 'javascript' | 'html'>('text');
    const [formattedPreview, setFormattedPreview] = useState<string | null>(null);

    // Advanced options
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [urlSafe, setUrlSafe] = useState(false);
    const [addMimeHeader, setAddMimeHeader] = useState(false);
    const [mimeType, setMimeType] = useState('text/plain');
    const [liveMode, setLiveMode] = useState(false);

    const debounceTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const modeTabs: TabItem<'text' | 'file'>[] = [
        { id: 'text', label: 'Text', icon: <FileText className="h-4 w-4" /> },
        { id: 'file', label: 'File', icon: <FileCode className="h-4 w-4" /> },
    ];

    const operationTabs: TabItem<'encode' | 'decode'>[] = [
        { id: 'encode', label: 'Encode' },
        { id: 'decode', label: 'Decode' },
    ];

    const detectTextFormat = useCallback((text: string) => {
        const trimmed = text.trim();

        // JSON detection
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                const parsed = JSON.parse(trimmed);
                setFormattedPreview(JSON.stringify(parsed, null, 4));
                setDetectedLanguage('json');
                return;
            } catch { /* ignore */ }
        }

        // XML/HTML detection
        if (trimmed.startsWith('<')) {
            if (trimmed.toLowerCase().startsWith('<!doctype html') || trimmed.toLowerCase().includes('<html')) {
                setDetectedLanguage('html');
            } else {
                setDetectedLanguage('xml');
            }
            return;
        }

        // Markdown detection (Heuristic)
        if (
            trimmed.startsWith('# ') ||
            trimmed.includes('\n# ') ||
            (trimmed.includes('**') && trimmed.includes('**')) ||
            (trimmed.includes('[') && trimmed.includes(']('))
        ) {
            setDetectedLanguage('markdown');
            return;
        }

        setDetectedLanguage('text');
    }, []);

    const handleProcess = useCallback(
        async (inputData?: string | Uint8Array) => {
            try {
                // Clean up previous decoded previews
                if (decodedImageUrl) { URL.revokeObjectURL(decodedImageUrl); setDecodedImageUrl(null); }
                if (decodedPdfUrl) { URL.revokeObjectURL(decodedPdfUrl); setDecodedPdfUrl(null); }
                setFormattedPreview(null);
                setDetectedLanguage('text');

                let processMode: Base64Mode;
                let data: string | number[];

                if (mode === 'text') {
                    const textData = inputData || inputText;
                    if (!textData || typeof textData !== 'string') return;

                    processMode = operation === 'encode' ? 'text_encode' : 'text_decode';
                    data = textData;
                } else {
                    if (!selectedFile && !inputData) return;

                    const fileData = inputData || (await selectedFile!.arrayBuffer());
                    const uint8Array = new Uint8Array(fileData as ArrayBuffer);

                    if (operation === 'encode') {
                        processMode = 'file_encode';
                        data = Array.from(uint8Array);
                    } else {
                        processMode = 'file_decode';
                        const decoder = new TextDecoder();
                        data = decoder.decode(uint8Array);
                    }
                }

                const res = await process({
                    mode: processMode,
                    data,
                    url_safe: urlSafe,
                    mime_type: addMimeHeader ? mimeType : '',
                });

                if (onResultUpdate) onResultUpdate(res);

                // After processing, detect format if it's a decode operation
                if (operation === 'decode' && res.success) {
                    let bytes: Uint8Array | null = null;
                    if (Array.isArray(res.result)) {
                        bytes = new Uint8Array(res.result);
                    }

                    if (bytes && bytes.length > 0) {
                        // 1. Binary Detection (Image, PDF)
                        let detectedMimeType = null;
                        if (bytes.length >= 4) {
                            if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) detectedMimeType = 'image/png';
                            else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) detectedMimeType = 'image/jpeg';
                            else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) detectedMimeType = 'image/gif';
                            else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes.length >= 12 && bytes[8] === 0x57) detectedMimeType = 'image/webp';
                            else if (bytes[0] === 0x42 && bytes[1] === 0x4D) detectedMimeType = 'image/bmp';
                            else if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) detectedMimeType = 'application/pdf';
                        }

                        if (detectedMimeType) {
                            const blob = new Blob([new Uint8Array(bytes)], { type: detectedMimeType });
                            const url = URL.createObjectURL(blob);
                            if (detectedMimeType === 'application/pdf') setDecodedPdfUrl(url);
                            else setDecodedImageUrl(url);
                        } else {
                            // 2. Text-based format detection
                            const decoder = new TextDecoder();
                            try {
                                const text = decoder.decode(bytes);
                                detectTextFormat(text);
                            } catch {
                                // Fallback to raw bytes
                                setDetectedLanguage('text');
                            }
                        }
                    } else if (typeof res.result === 'string') {
                        detectTextFormat(res.result);
                    }
                }
            } catch (err) {
                console.error('Processing error:', err);
            }
        },
        [mode, operation, inputText, selectedFile, urlSafe, addMimeHeader, mimeType, process, decodedImageUrl, decodedPdfUrl, detectTextFormat, onResultUpdate]
    );

    useEffect(() => {
        if (liveMode && mode === 'text' && inputText && isReady) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => handleProcess(), 500);
        }
        return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    }, [liveMode, mode, inputText, isReady, handleProcess]);

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    // Handle results when they change
    const handleDownload = () => {
        if (mode === 'text') {
            downloadResult(`base64_${operation}.txt`);
        } else {
            const baseFilename = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'file';
            const ext = operation === 'encode' ? 'txt' : (selectedFile?.name.split('.').pop() || 'bin');
            downloadResult(`${baseFilename}_${operation}.${ext}`);
        }
    };

    const handleFileSelected = (file: File | null) => {
        setSelectedFile(file);
        reset();
        if (imagePreview) { URL.revokeObjectURL(imagePreview); setImagePreview(null); }
        if (file) {
            const isImageFile = file.type.startsWith('image/');
            if (isImageFile && operation === 'encode') {
                const previewUrl = URL.createObjectURL(file);
                setImagePreview(previewUrl);
            }
            if (operation === 'encode') setMimeType(file.type || 'application/octet-stream');
        } else {
        }
    };

    const acceptedFiles = useMemo(() => {
        if (operation === 'decode') return '.txt,.b64';
        return 'image/*,application/pdf,application/json,text/markdown,text/plain,application/xml,text/xml,.md,.json,.xml,.txt,.csv,.yaml,.yml';
    }, [operation]);

    return (
        <div className="flex flex-col h-full space-y-6">
            {showControls && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-(--surface-overlay)/40 backdrop-blur-md rounded-2xl border border-(--border-subtle) shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <Tabs
                            tabs={modeTabs}
                            value={mode}
                            onChange={(m) => { setMode(m); reset(); }}
                            size="sm"
                            className="bg-transparent border-none shadow-none"
                        />

                        <div className="w-px h-6 bg-(--border-subtle) mx-1" />

                        <Tabs
                            tabs={operationTabs}
                            value={operation}
                            onChange={(op) => { setOperation(op); reset(); }}
                            size="sm"
                            className="bg-transparent border-none shadow-none"
                        />

                        <div className="w-px h-6 bg-(--border-subtle) mx-1" />

                        <div className="flex items-center gap-4 px-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <Switch checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />
                                <span className="text-sm font-medium text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">URL Safe</span>
                            </label>

                            {mode === 'text' && (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <Switch checked={liveMode} onChange={(e) => setLiveMode(e.target.checked)} />
                                    <span className="text-sm font-medium text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">Live Mode</span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        <Button 
                            variant="ghost"
                            onClick={() => setShowAdvanced(!showAdvanced)} 
                            className={`flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-colors ${showAdvanced ? 'bg-(--primary)/10 text-(--primary)' : 'text-(--text-secondary) hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            <Settings className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                            Settings
                        </Button>

                        <div className="w-px h-6 bg-(--border-subtle) mx-1" />

                        <Button
                            onClick={() => handleProcess()}
                            disabled={isProcessing || (mode === 'text' && !inputText) || (mode === 'file' && !selectedFile)}
                            className="relative h-10 px-6 rounded-xl font-bold group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                        >
                            <div className="relative z-10 flex items-center gap-2">
                                {isProcessing ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Zap className="h-4 w-4 text-blue-200 group-hover:text-white transition-colors" />
                                )}
                                <span className="text-sm">
                                    {operation === 'encode' ? 'Encode' : 'Decode'}
                                </span>
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showAdvanced && (
                    <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <Card className="p-4 bg-(--surface-overlay) border border-(--border-subtle)">
                            <div className="flex items-center gap-3">
                                <Switch checked={addMimeHeader} onChange={(e) => setAddMimeHeader(e.target.checked)} />
                                <Label className="font-medium text-(--text-primary)">Add MIME Header</Label>
                                {addMimeHeader && (
                                    <Input
                                        value={mimeType}
                                        onChange={(e) => setMimeType(e.target.value)}
                                        placeholder="e.g., text/plain"
                                        className="max-w-xs h-9 bg-(--input-bg) border-(--border-medium)"
                                    />
                                )}
                            </div>
                        </Card>
                    </m.div>
                )}
            </AnimatePresence>

            <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* LEFT: INPUT */}
                <m.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex flex-col min-h-0"
                >
                    <Card className="flex flex-col bg-(--surface-overlay)/60 backdrop-blur-md border border-(--border-subtle) shadow-2xl overflow-hidden h-full rounded-2xl group transition-all hover:border-(--primary)/30">
                        <div className="p-4 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--surface-secondary)/20">
                            <h2 className="font-semibold flex items-center gap-3 text-(--text-primary)">
                                <div className="flex items-center justify-center w-8 h-8 bg-(--primary) text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20">
                                    1
                                </div>
                                Input {mode === 'text' ? 'Content' : 'File'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-(--surface-secondary) text-[10px] font-bold uppercase tracking-wider text-(--text-tertiary) border border-(--border-subtle)">
                                    {mode}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            {mode === 'text' ? (
                                <Editor
                                    height="100%"
                                    defaultLanguage="text"
                                    theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                                    value={inputText}
                                    onChange={(val) => setInputText(val || '')}
                                    options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', padding: { top: 16 } }}
                                />
                            ) : (
                                <div className="p-6 h-full overflow-auto space-y-4 custom-scrollbar">
                                    <FileDropZone onFileSelected={handleFileSelected} accept={acceptedFiles} />
                                    {selectedFile && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-(--primary)/5 rounded-xl border border-(--primary)/10 group-hover:border-(--primary)/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-(--primary)/10 rounded-xl">
                                                        <FileText className="h-5 w-5 text-(--primary)" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm truncate max-w-[200px] text-(--text-primary)">{selectedFile.name}</p>
                                                        <p className="text-xs text-(--text-tertiary) font-medium">{formatFileSize(selectedFile.size)}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => handleFileSelected(null)} className="text-red-500 hover:bg-red-500/10 h-9 px-4 rounded-lg font-semibold">Remove</Button>
                                            </div>
                                            {imagePreview && (
                                                <div className="p-4 bg-(--surface-secondary)/50 rounded-xl border border-(--border-subtle) flex flex-col items-center">
                                                    <p className="text-[10px] font-bold opacity-40 mb-3 self-start uppercase tracking-widest text-(--text-tertiary)">Image Preview</p>
                                                    <div className="relative group/img">
                                                        <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg shadow-2xl object-contain transition-transform group-hover/img:scale-[1.02]" />
                                                        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </m.div>

                {/* RIGHT: OUTPUT */}
                <m.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex flex-col min-h-0"
                >
                    <Card className="flex flex-col bg-(--surface-overlay)/60 backdrop-blur-md border border-(--border-subtle) shadow-2xl overflow-hidden h-full rounded-2xl group transition-all hover:border-green-500/30">
                        <div className="p-4 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--surface-secondary)/20">
                            <h2 className="font-semibold flex items-center gap-3 text-(--text-primary)">
                                <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-500/20">
                                    2
                                </div>
                                Result
                            </h2>
                            <div className="flex items-center gap-2">
                                {result?.success && (
                                    <>
                                        <span className="text-[10px] font-bold text-(--text-tertiary) mr-3 uppercase tracking-wider">{formatFileSize(result.size || 0)}</span>
                                        {!isLargeFile && result.result && (
                                            <div className="p-0.5 bg-(--surface-secondary) rounded-lg border border-(--border-subtle)">
                                                <CopyToClipboard text={typeof result.result === 'string' ? result.result : (formattedPreview || previewText)} showText={false} />
                                            </div>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDownload}
                                            className="h-8 w-8 p-0 text-(--text-secondary) hover:text-green-500 hover:bg-green-500/10 rounded-lg"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            {error ? (
                                <div className="p-8 h-full flex items-center justify-center">
                                    <div className="max-w-md w-full p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col items-center text-center gap-4">
                                        <div className="p-3 bg-red-500/10 rounded-full">
                                            <AlertCircle className="h-8 w-8 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-red-500 text-lg">Processing Error</p>
                                            <p className="text-sm text-red-500/70 font-medium mt-1 leading-relaxed">{error}</p>
                                        </div>
                                        <Button variant="ghost" onClick={reset} className="text-red-500 hover:bg-red-500/10">Try again</Button>
                                    </div>
                                </div>
                            ) : result?.success ? (
                                decodedImageUrl ? (
                                    <div className="p-8 h-full overflow-auto flex flex-col items-center custom-scrollbar">
                                        <div className="w-full mb-6 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-2 uppercase tracking-[0.2em] justify-center">
                                            <Eye className="h-3 w-3" /> Image Preview
                                        </div>
                                        <div className="relative group/res mt-auto mb-auto">
                                            <img src={decodedImageUrl} alt="Decoded" className="max-w-full max-h-[400px] rounded-xl shadow-2xl border border-(--border-subtle) object-contain transition-transform group-hover/res:scale-[1.02]" />
                                            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                                        </div>
                                    </div>
                                ) : decodedPdfUrl ? (
                                    <div className="h-full flex flex-col">
                                        <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 uppercase tracking-[0.2em] justify-center">
                                            <FileText className="h-3 w-3" /> PDF Document
                                        </div>
                                        <iframe src={decodedPdfUrl} className="w-full h-full bg-(--surface-secondary)/20" title="PDF Preview" />
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col">
                                        <div className="px-4 py-2 bg-(--surface-secondary)/30 border-b border-(--border-subtle) text-[10px] font-bold text-(--text-tertiary) flex items-center justify-between uppercase tracking-widest">
                                            <span className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Detected: {detectedLanguage}
                                            </span>
                                            {Array.isArray(result.result) && <span>Binary Stream</span>}
                                        </div>
                                        <Editor
                                            height="100%"
                                            language={detectedLanguage}
                                            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                                            value={formattedPreview || previewText}
                                            options={{ readOnly: true, minimap: { enabled: !isLargeFile }, fontSize: 13, wordWrap: 'on', padding: { top: 16 }, scrollBeyondLastLine: false }}
                                        />
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center p-8">
                                        <div className="relative mb-6">
                                            <Sparkles className="h-16 w-16 mx-auto text-(--primary) opacity-20" />
                                            <m.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 4, repeat: Infinity }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <Sparkles className="h-16 w-16 text-(--primary) blur-xl" />
                                            </m.div>
                                        </div>
                                        <h3 className="text-lg font-bold text-(--text-primary) mb-2">Ready to Process</h3>
                                        <p className="text-sm font-medium text-(--text-tertiary) max-w-[200px] mx-auto leading-relaxed">
                                            Configure your input and click the button above to start the conversion.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </m.div>
            </div>
        </div>
    );
}
