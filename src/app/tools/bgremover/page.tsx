'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Check
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
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
            backgroundColor: '#fff'
        }}
    />
);

const DemoAnimation = () => {
    return (
        <div className="relative w-full max-w-md mx-auto h-64 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl mb-12 select-none group">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-48 h-48">
                    {/* Background Layer (Grid) to represent transparency */}
                    <CheckerboardBackground opacity={0.5} />

                    {/* Target User Image (Simulated) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg z-10">
                            <span className="text-white text-4xl">👤</span>
                        </div>
                    </div>

                    {/* Original Background (being removed) */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl z-0"
                        initial={{ clipPath: 'inset(0 0 0 0)' }}
                        animate={{ clipPath: ['inset(0 0 0 0)', 'inset(0 0 0 100%)', 'inset(0 0 0 100%)', 'inset(0 0 0 0)'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                    />

                    {/* Scanner Line */}
                    <motion.div
                        className="absolute inset-0 z-20 pointer-events-none"
                        initial={{ left: '-10%' }}
                        animate={{ left: ['0%', '100%', '100%', '0%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                    >
                        <div className="h-full w-1 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    </motion.div>
                </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 text-slate-600 text-xs backdrop-blur-md border border-slate-200">
                    <Wand2 className="w-3 h-3 text-indigo-500" />
                    AI Auto-Removal
                </span>
            </div>
        </div>
    );
};

export default function BgRemoverPage() {
    const [images, setImages] = useState<ImageItem[]>([]);
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [urlInput, setUrlInput] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Process queue effect
    useEffect(() => {
        const processNext = async () => {
            if (processingId) return; // Already processing

            const nextImage = images.find(img => img.status === 'pending');
            if (!nextImage) return; // Nothing to process

            setProcessingId(nextImage.id);

            // Update status to processing
            setImages(prev => prev.map(img =>
                img.id === nextImage.id ? { ...img, status: 'processing' } : img
            ));

            try {
                // Construct public path for local assets
                const publicPath = `${window.location.origin}/imgly/`;

                const config: Config = {
                    publicPath: publicPath, // Use local assets to prevent "Failed to fetch"
                    model: 'isnet', // Use the heavier model for better quality
                    output: {
                        format: 'image/png',
                        quality: 1.0, // Maximum quality
                    },
                    progress: (key, current, total) => {
                        setDownloadProgress(`Loading AI Model (${key}): ${Math.round(current / total * 100)}%`);
                    }
                };

                const blob = await removeBackground(nextImage.file || nextImage.originalUrl, config);
                const processedUrl = URL.createObjectURL(blob);

                setImages(prev => prev.map(img =>
                    img.id === nextImage.id ? { ...img, status: 'completed', processedUrl } : img
                ));
            } catch (err) {
                console.error("BG Removal Error", err);
                setImages(prev => prev.map(img =>
                    img.id === nextImage.id ? { ...img, status: 'error', error: 'Failed to process image. Check console.' } : img
                ));
            } finally {
                setProcessingId(null);
                setDownloadProgress(null);
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
            originalUrl: URL.createObjectURL(file), // Create object URL for preview and processing
            file: file,
            processedUrl: null,
            status: 'pending',
            name: file.name
        }));

        setImages(prev => [...prev, ...newImages]);
    };

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput) return;

        if (images.length >= 5) {
            alert("Maximum 5 images allowed");
            return;
        }

        // Basic URL validation
        try {
            new URL(urlInput);
        } catch {
            alert("Please enter a valid URL");
            return;
        }

        const newItem: ImageItem = {
            id: Math.random().toString(36).substring(7),
            originalUrl: urlInput,
            processedUrl: null,
            status: 'pending', // Will switch to processing immediately
            name: 'Image from URL'
        };

        setImages(prev => [...prev, newItem]);
        setUrlInput('');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.length) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const removeImage = (id: string) => {
        setImages(prev => {
            const item = prev.find(i => i.id === id);
            if (item) {
                // Cleanup object URLs to avoid memory leaks
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
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 font-sans">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10 max-w-2xl"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center p-3 mb-6 bg-white rounded-2xl border border-indigo-100 shadow-sm"
                    >
                        <Wand2 className="w-5 h-5 text-indigo-500 mr-2" />
                        <span className="font-medium text-indigo-600">
                            AI Background Remover
                        </span>
                    </motion.div>

                    {downloadProgress && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                        >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {downloadProgress}
                        </motion.div>
                    )}

                    <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-slate-900">
                        Remove Backgrounds <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            Instantly & Free
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600">
                        Upload images or paste a URL. High-quality AI processing runs 100% in your browser.
                        No logins, no watermarks, completely private.
                    </p>
                </motion.div>

                {/* Helper Animation */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-full"
                >
                    <DemoAnimation />
                </motion.div>

                {/* Input Area */}
                <motion.div
                    layout
                    className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 mb-12"
                >
                    <div className="flex gap-4 mb-6 p-1 bg-slate-100 rounded-xl w-fit mx-auto">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                activeTab === 'upload' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Upload className="w-4 h-4" />
                            Upload Image
                        </button>
                        <button
                            onClick={() => setActiveTab('url')}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                activeTab === 'url' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <LinkIcon className="w-4 h-4" />
                            Paste URL
                        </button>
                    </div>

                    <div className="min-h-[200px] flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            {activeTab === 'upload' ? (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full h-full"
                                >
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                        onDragLeave={() => setIsDragOver(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "group border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-slate-50/50",
                                            isDragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
                                        )}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                        />
                                        <div className="p-4 rounded-full bg-indigo-50 mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <ImageIcon className="w-8 h-8 text-indigo-500" />
                                        </div>
                                        <p className="text-lg font-medium mb-2 text-slate-700">Click or Drag images here</p>
                                        <p className="text-sm text-slate-500">Supports JPG, PNG, WEBP (Max 5 images)</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="url"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full h-64 flex flex-col justify-center items-center"
                                >
                                    <form onSubmit={handleUrlSubmit} className="w-full max-w-lg flex flex-col gap-4">
                                        <div className="relative group">
                                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="url"
                                                value={urlInput}
                                                onChange={(e) => setUrlInput(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!urlInput}
                                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                                        >
                                            Import Image
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Results Section */}
                <div className="w-full max-w-4xl space-y-4">
                    <AnimatePresence>
                        {images.map((img) => (
                            <motion.div
                                key={img.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg shadow-slate-100"
                            >
                                <div className="p-4 md:p-6 grid md:grid-cols-[1fr,auto] gap-6 items-center">
                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        {/* Before */}
                                        <div className="relative group w-full md:w-64 aspect-video bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white/90 uppercase tracking-wider backdrop-blur-md">Original</div>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={img.originalUrl} alt="Original" className="w-full h-full object-contain" />
                                        </div>

                                        {/* Arrow or Status */}
                                        <div className="flex items-center justify-center text-slate-400">
                                            {img.status === 'processing' && <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />}
                                            {img.status === 'completed' && <Wand2 className="w-6 h-6 text-green-500" />}
                                            {img.status === 'error' && <AlertCircle className="w-6 h-6 text-red-500" />}
                                            {img.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-300" />}
                                        </div>

                                        {/* After */}
                                        <div className="relative group w-full md:w-64 aspect-video bg-[#e0e0e0] rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                                            {/* Transparency Grid */}
                                            <CheckerboardBackground opacity={0.4} />

                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 z-10 rounded text-[10px] text-white/90 uppercase tracking-wider backdrop-blur-md">Result</div>

                                            {img.status === 'completed' && img.processedUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={img.processedUrl} alt="Processed" className="relative z-10 w-full h-full object-contain" />
                                            ) : (
                                                <div className="relative z-10 text-slate-500 text-sm font-medium">
                                                    {img.status === 'processing' ? 'Removing background...' : img.status === 'error' ? 'Failed' : 'Waiting...'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex md:flex-col gap-3 justify-end w-full md:w-auto mt-4 md:mt-0">
                                        {img.status === 'completed' && img.processedUrl && (
                                            <a
                                                href={img.processedUrl}
                                                download={`bg-removed-${img.name.replace(/\.[^/.]+$/, "")}.png`}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors font-medium text-sm border border-green-200"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </a>
                                        )}
                                        <button
                                            onClick={() => removeImage(img.id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors font-medium text-sm border border-red-200"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
