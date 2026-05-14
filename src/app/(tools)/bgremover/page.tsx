'use client';

import React, { useState, useRef, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { removeBackground, Config } from '@imgly/background-removal';
import {
    Upload,
    Download,
    Image as ImageIcon,
    Link as LinkIcon,
    Loader2,
    Wand2,
    Trash2,
    AlertCircle,
    Check,
    Copy,
    ChevronRight,
    Sparkles,
    MousePointer2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

async function copyImageToClipboard(url: string) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        return true;
    } catch (err) {
        console.error('Failed to copy image: ', err);
        return false;
    }
}

// --- Types ---
type ImageStatus = 'pending' | 'processing' | 'completed' | 'error';

interface ImageItem {
    id: string;
    originalUrl: string;
    file?: File;
    processedUrl: string | null;
    status: ImageStatus;
    name: string;
    error?: string;
    progress?: number;
}

// --- Components ---

const CheckerboardBackground = ({ opacity = 0.5 }: { opacity?: number }) => (
    <div
        className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
        style={{
            opacity,
            backgroundImage: `
        linear-gradient(45deg, #ddd 25%, transparent 25%), 
        linear-gradient(-45deg, #ddd 25%, transparent 25%), 
        linear-gradient(45deg, transparent 75%, #ddd 75%), 
        linear-gradient(-45deg, transparent 75%, #ddd 75%)
      `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            backgroundColor: '#f8fafc'
        }}
    />
);

const ResultPreview = ({ processed, original, status }: { processed: string | null; original: string; status: ImageStatus }) => {
    return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50">
            {/* Background Layer (Transparency Grid) */}
            <CheckerboardBackground opacity={0.4} />

            {/* Main Image Display */}
            <AnimatePresence mode="wait">
                {status === 'completed' && processed ? (
                    <m.img 
                        key="processed"
                        src={processed} 
                        alt="Processed" 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 w-full h-full object-contain p-4 z-10" 
                    />
                ) : (
                    <m.img 
                        key="original"
                        src={original} 
                        alt="Original" 
                        initial={{ opacity: 1 }}
                        animate={{ opacity: status === 'processing' ? 0.3 : 1 }}
                        className="absolute inset-0 w-full h-full object-contain p-4 grayscale-[0.5] opacity-50" 
                    />
                )}
            </AnimatePresence>

            {/* Scanning Line for processing state */}
            <ScanningLine status={status} />
            
            {/* Status Badge */}
            {status === 'completed' && (
                <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-widest rounded-full shadow-lg flex items-center gap-1.5">
                    <Check className="w-3 h-3" />
                    Success
                </div>
            )}
        </div>
    );
};

const ScanningLine = ({ status }: { status: ImageStatus }) => {
    if (status !== 'processing') return null;
    return (
        <m.div
            className="absolute inset-y-0 w-1 z-30 pointer-events-none"
            initial={{ left: '0%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
            <div className="h-full w-full bg-gradient-to-b from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            <m.div 
                className="absolute top-0 left-0 w-40 h-full bg-gradient-to-r from-indigo-500/20 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
        </m.div>
    );
};

export default function BgRemoverPage() {
    const [images, setImages] = useState<ImageItem[]>([]);
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [urlInput, setUrlInput] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Process queue effect
    useEffect(() => {
        const processNext = async () => {
            if (processingId) return;

            const nextImage = images.find(img => img.status === 'pending');
            if (!nextImage) return;

            setProcessingId(nextImage.id);
            setImages(prev => prev.map(img =>
                img.id === nextImage.id ? { ...img, status: 'processing', progress: 0 } : img
            ));

            try {
                const publicPath = `${window.location.origin}/imgly/`;
                let lastUpdate = 0;

                const config: Config = {
                    publicPath: publicPath,
                    model: 'isnet_fp16',
                    output: {
                        format: 'image/png',
                        quality: 1.0,
                    },
                    progress: (key, current, total) => {
                        const now = Date.now();
                        if (now - lastUpdate > 100) {
                            const p = Math.round((current / total) * 100);
                            setImages(prev => prev.map(img =>
                                img.id === nextImage.id ? { ...img, progress: p } : img
                            ));
                            lastUpdate = now;
                        }
                    }
                };

                await new Promise(resolve => setTimeout(resolve, 500));
                const blob = await removeBackground(nextImage.file || nextImage.originalUrl, config);

                // --- Post-Processing ---
                let processedUrl: string | null = null;
                try {
                    const cleanupBitmap = await createImageBitmap(blob);
                    const canvas = document.createElement('canvas');
                    canvas.width = cleanupBitmap.width;
                    canvas.height = cleanupBitmap.height;
                    const ctx = canvas.getContext('2d');

                    if (ctx) {
                        ctx.drawImage(cleanupBitmap, 0, 0);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;

                        for (let i = 3; i < data.length; i += 4) {
                            if (data[i] < 40) data[i] = 0;
                            else data[i] = 255;
                        }
                        ctx.putImageData(imageData, 0, 0);
                        const cleanBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                        processedUrl = cleanBlob ? URL.createObjectURL(cleanBlob) : URL.createObjectURL(blob);
                    } else {
                        processedUrl = URL.createObjectURL(blob);
                    }
                } catch (e) {
                    processedUrl = URL.createObjectURL(blob);
                }

                setImages(prev => prev.map(img =>
                    img.id === nextImage.id ? { ...img, status: 'completed', processedUrl, progress: 100 } : img
                ));
            } catch (err) {
                console.error("BG Removal Error", err);
                let errorMessage = 'Failed to process image.';
                if (!nextImage.file && nextImage.originalUrl.startsWith('http')) {
                    errorMessage = 'CORS error: Please upload manually.';
                }
                setImages(prev => prev.map(img =>
                    img.id === nextImage.id ? { ...img, status: 'error', error: errorMessage } : img
                ));
            } finally {
                setProcessingId(null);
            }
        };

        processNext();
    }, [images, processingId]);

    const handleFiles = (files: FileList | File[]) => {
        if (images.length + files.length > 5) {
            alert("Maximum 5 images allowed");
            return;
        }

        const newImages: ImageItem[] = Array.from(files).map(file => ({
            id: Math.random().toString(36).substring(7),
            originalUrl: URL.createObjectURL(file),
            file: file,
            processedUrl: null,
            status: 'pending',
            name: file.name
        }));

        setImages(prev => [...prev, ...newImages]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.length) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput || images.length >= 5) return;

        try {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(urlInput)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error("Fetch failed");
            const blob = await response.blob();
            const localUrl = URL.createObjectURL(blob);
            const file = new File([blob], 'image_from_url.png', { type: blob.type });

            const newItem: ImageItem = {
                id: Math.random().toString(36).substring(7),
                originalUrl: localUrl,
                file: file,
                processedUrl: null,
                status: 'pending',
                name: 'Imported Image'
            };

            setImages(prev => [...prev, newItem]);
            setUrlInput('');
        } catch (error) {
            alert("Failed to import URL.");
        }
    };

    const handleCopy = async (id: string, url: string) => {
        const success = await copyImageToClipboard(url);
        if (success) {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const removeImage = (id: string) => {
        setImages(prev => {
            const item = prev.find(i => i.id === id);
            if (item) {
                if (item.originalUrl.startsWith('blob:')) URL.revokeObjectURL(item.originalUrl);
                if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
            }
            return prev.filter(i => i.id !== id);
        });
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            images.forEach(img => {
                if (img.originalUrl.startsWith('blob:')) URL.revokeObjectURL(img.originalUrl);
                if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
            });
        };
    }, [images]);

    return (
        <div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-indigo-100 font-sans pb-24">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/40 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/40 rounded-full blur-[140px]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
                
                {/* Hero Section */}
                <AnimatePresence mode="wait">
                    {images.length === 0 && (
                        <m.div 
                            key="hero"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                            className="text-center mb-16 max-w-3xl"
                        >
                            <m.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-white/60 backdrop-blur-xl rounded-full border border-indigo-100 shadow-sm"
                            >
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                    Local AI Processing
                                </span>
                            </m.div>

                            <h1 className="text-6xl md:text-7xl font-extrabold mb-8 tracking-tight text-slate-900">
                                Backgrounds <br />
                                <span className="relative">
                                    <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x">
                                        Vanish Like Magic.
                                    </span>
                                    <m.span 
                                        className="absolute bottom-2 left-0 w-full h-3 bg-indigo-100/50 -z-0 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ delay: 0.6, duration: 0.8 }}
                                    />
                                </span>
                            </h1>
                            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
                                High-precision background removal that runs 100% in your browser. 
                                Private, secure, and professional-grade subject isolation.
                            </p>
                        </m.div>
                    )}
                </AnimatePresence>

                {/* Main Upload Box */}
                <m.div 
                    layout
                    initial={false}
                    className={cn(
                        "w-full transition-all duration-500 ease-in-out",
                        images.length > 0 
                            ? "max-w-4xl bg-white/40 backdrop-blur-md border border-slate-200 rounded-2xl p-2 mb-8" 
                            : "max-w-3xl bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-3 shadow-2xl shadow-indigo-100/50 mb-16 overflow-hidden"
                    )}
                >
                    <div className={cn(
                        "bg-slate-50/50 rounded-[2rem] border border-slate-100/50 transition-all duration-500",
                        images.length > 0 ? "p-4" : "p-6 md:p-10"
                    )}>
                        <div className={cn(
                            "flex gap-2 p-1.5 bg-slate-200/40 rounded-2xl w-fit mx-auto backdrop-blur-md transition-all duration-500",
                            images.length > 0 ? "mb-0" : "mb-10"
                        )}>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={cn(
                                    "rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                                    images.length > 0 ? "px-4 py-2" : "px-8 py-3",
                                    activeTab === 'upload' ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100 ring-1 ring-indigo-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                )}
                            >
                                <Upload className="w-4 h-4" />
                                {images.length > 0 ? "Add File" : "File Upload"}
                            </button>
                            <button
                                onClick={() => setActiveTab('url')}
                                className={cn(
                                    "rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                                    images.length > 0 ? "px-4 py-2" : "px-8 py-3",
                                    activeTab === 'url' ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100 ring-1 ring-indigo-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                )}
                            >
                                <LinkIcon className="w-4 h-4" />
                                {images.length > 0 ? "Add URL" : "URL Paste"}
                            </button>
                        </div>

                        <AnimatePresence>
                            {images.length === 0 && (
                                <m.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="min-h-[220px] mt-6">
                                        <AnimatePresence mode="wait">
                                            {activeTab === 'upload' ? (
                                                <m.div
                                                    key="upload"
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    className="w-full h-full"
                                                >
                                                    <div
                                                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                                        onDragLeave={() => setIsDragOver(false)}
                                                        onDrop={handleDrop}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className={cn(
                                                            "group border-2 border-dashed rounded-[1.5rem] h-64 flex flex-col items-center justify-center cursor-pointer transition-all duration-500",
                                                            isDragOver ? "border-indigo-500 bg-indigo-50/50 scale-[1.02]" : "border-slate-200 hover:border-indigo-400 hover:bg-white"
                                                        )}
                                                    >
                                                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                                                        <div className="p-6 rounded-3xl bg-indigo-50 mb-6 group-hover:bg-indigo-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                            <ImageIcon className="w-10 h-10 text-indigo-600" />
                                                        </div>
                                                        <p className="text-xl font-bold mb-2 text-slate-800">Drop your images here</p>
                                                        <p className="text-sm text-slate-400 font-medium tracking-wide">JPG, PNG or WEBP (Max 5MB)</p>
                                                    </div>
                                                </m.div>
                                            ) : (
                                                <m.div
                                                    key="url"
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    className="w-full h-64 flex flex-col justify-center items-center px-4"
                                                >
                                                    <form onSubmit={handleUrlSubmit} className="w-full max-w-lg space-y-4">
                                                        <div className="relative group">
                                                            <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                            <input
                                                                type="url"
                                                                value={urlInput}
                                                                onChange={(e) => setUrlInput(e.target.value)}
                                                                placeholder="Paste image address..."
                                                                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-5 pl-14 pr-6 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm placeholder:text-slate-400 font-medium"
                                                            />
                                                        </div>
                                                        <button
                                                            type="submit"
                                                            disabled={!urlInput}
                                                            className="w-full h-14 bg-slate-900 hover:bg-indigo-600 disabled:opacity-30 text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-2 group"
                                                        >
                                                            <span>Import Subject</span>
                                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </button>
                                                    </form>
                                                </m.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>
                        
                        {/* Compact URL/Upload Fields when images exist */}
                        <AnimatePresence>
                            {images.length > 0 && (
                                <m.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden mt-4"
                                >
                                    {activeTab === 'url' ? (
                                        <form onSubmit={handleUrlSubmit} className="flex gap-2 w-full max-w-2xl mx-auto">
                                            <input
                                                type="url"
                                                value={urlInput}
                                                onChange={(e) => setUrlInput(e.target.value)}
                                                placeholder="Paste another URL..."
                                                className="flex-grow bg-white/50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                                            />
                                            <button type="submit" disabled={!urlInput} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50">Add</button>
                                        </form>
                                    ) : (
                                        <div className="text-center">
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-2 mx-auto"
                                            >
                                                <Upload className="w-3 h-3" />
                                                Click to upload more files
                                            </button>
                                            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                                        </div>
                                    )}
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>
                </m.div>

                {/* Queue / Results */}
                <div className="w-full max-w-4xl space-y-12">
                    <AnimatePresence mode="popLayout">
                        {images.map((img) => (
                            <m.div
                                key={img.id}
                                layout
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden p-3"
                            >
                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* Preview Area */}
                                    <div className="relative w-full lg:w-[540px] aspect-video flex-shrink-0 bg-slate-50 rounded-[1.5rem] overflow-hidden group-hover:shadow-lg transition-shadow duration-500">
                                        <ResultPreview 
                                            processed={img.processedUrl} 
                                            original={img.originalUrl} 
                                            status={img.status} 
                                        />
                                    </div>

                                    {/* Info & Metadata */}
                                    <div className="flex-grow flex flex-col justify-center py-6 pr-8 pl-4 lg:pl-0">
                                        <div className="mb-10">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 backdrop-blur-sm rounded-xl w-fit border border-slate-200/50">
                                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-500 truncate max-w-[240px]">
                                                    {img.name === 'Imported Image' ? 'Isolated Subject' : img.name}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {img.status === 'completed' && img.processedUrl ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleCopy(img.id, img.processedUrl!)}
                                                        className="h-14 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98] shadow-lg shadow-slate-100"
                                                    >
                                                        {copiedId === img.id ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                                                        {copiedId === img.id ? 'Copied!' : 'Copy'}
                                                    </button>
                                                    <a
                                                        href={img.processedUrl}
                                                        download={`isolated-${img.name.replace(/\.[^/.]+$/, "")}.png`}
                                                        className="h-14 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98] border border-indigo-100 shadow-sm"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                        PNG
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="col-span-2 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 font-bold italic">
                                                    Action buttons locked...
                                                </div>
                                            )}
                                        </div>
                                        
                                        <button
                                            onClick={() => removeImage(img.id)}
                                            className="mt-6 text-slate-300 hover:text-red-400 text-sm font-bold flex items-center gap-2 transition-colors w-fit group/btn"
                                        >
                                            <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                            Discard Image
                                        </button>
                                    </div>
                                </div>
                            </m.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty State Helper */}
                {images.length === 0 && (
                    <m.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center text-slate-300 font-bold uppercase tracking-[0.2em] text-[10px]"
                    >
                        Drag subjects to begin the transformation
                    </m.div>
                )}
            </div>
        </div>
    );
}
