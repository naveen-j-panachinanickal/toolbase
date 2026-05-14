'use client';

import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import { Minimize2, Download, RefreshCw, AlertCircle, CheckCircle, Flame, Leaf, Feather } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTIPTool } from '@/hooks/useTIPTool';
import { cn } from '@/lib/utils';

export default function CompressPdf() {
    const [file, setFile] = useState<File | null>(null);
    const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
    const [compressedSize, setCompressedSize] = useState<number>(0);
    const [compressionLevel, setCompressionLevel] = useState<'recommended' | 'extreme' | 'less'>('recommended');
    const { execute, isProcessing, error, progress, progressMessage } = useTIPTool('magic-pdf/compress');

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setCompressedPdfUrl(null);
            setCompressedSize(0);
        }
    };

    const handleCompress = async () => {
        if (!file) return;
        try {
            const outputFiles = await execute([file], { level: compressionLevel });

            if (outputFiles && outputFiles.length > 0) {
                const blob = outputFiles[0];
                const url = URL.createObjectURL(blob);
                setCompressedPdfUrl(url);
                setCompressedSize(blob.size);
            }
        } catch (e) {
            console.error(e);
            alert("Compression failed: " + (e as Error).message);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const calculateSavings = () => {
        if (!file || compressedSize === 0) return 0;
        const diff = file.size - compressedSize;
        return ((diff / file.size) * 100).toFixed(1);
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
                {!file ? (
                    <m.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <Card className="p-8">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-semibold mb-2">Compress PDF</h2>
                                <p className="text-text-muted">Reduce file size while maintaining quality.</p>

                            </div>
                            <FileUploader
                                onFilesSelected={handleFileSelected}
                                accept=".pdf"
                                multiple={false}
                                className="max-w-2xl mx-auto"
                            />
                        </Card>
                    </m.div>
                ) : (
                    <m.div
                        key="workspace"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <Card className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                        <Minimize2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-text-primary">{file.name}</h3>
                                        <p className="text-sm text-text-muted">Original Size: {formatSize(file.size)}</p>
                                    </div>
                                </div>
                                {!compressedPdfUrl && (
                                    <Button variant="ghost" onClick={() => setFile(null)}>Change File</Button>
                                )}
                            </div>

                            {!compressedPdfUrl && (
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setCompressionLevel('extreme')}
                                        className={cn(
                                            "p-4 rounded-xl border text-left transition-all hover:bg-red-50 relative overflow-hidden",
                                            compressionLevel === 'extreme' ? "border-red-500 bg-red-50 ring-2 ring-red-200" : "border-border-medium"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs font-bold text-red-600 uppercase">Extreme</span>
                                            {compressionLevel === 'extreme' && <CheckCircle className="w-4 h-4 text-red-600" />}
                                        </div>
                                        <p className="text-sm text-text-muted mb-1">70-90% reduction</p>
                                        <p className="text-xs text-text-faint">⚠️ Text becomes non-selectable</p>
                                    </button>

                                    <button
                                        onClick={() => setCompressionLevel('recommended')}
                                        className={cn(
                                            "p-4 rounded-xl border text-left transition-all hover:bg-primary/5 relative overflow-hidden",
                                            compressionLevel === 'recommended' ? "border-blue-500 bg-primary/5 ring-2 ring-blue-200" : "border-border-medium"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs font-bold text-primary uppercase">Recommended</span>
                                            {compressionLevel === 'recommended' && <CheckCircle className="w-4 h-4 text-primary" />}
                                        </div>
                                        <p className="text-sm text-text-muted mb-1">40-60% reduction</p>
                                        <p className="text-xs text-text-faint">⚠️ Text becomes non-selectable</p>
                                    </button>

                                    <button
                                        onClick={() => setCompressionLevel('less')}
                                        className={cn(
                                            "p-4 rounded-xl border text-left transition-all hover:bg-green-500/5 relative overflow-hidden",
                                            compressionLevel === 'less' ? "border-green-500 bg-green-500/5 ring-2 ring-green-200" : "border-border-medium"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs font-bold text-green-500 uppercase">Low Compression</span>
                                            {compressionLevel === 'less' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        </div>
                                        <p className="text-sm text-text-muted">High quality</p>
                                    </button>
                                </div>
                            )}

                            <div className="mt-8 flex flex-col items-center">
                                {!compressedPdfUrl ? (
                                    <>
                                        <Button
                                            size="lg"
                                            onClick={handleCompress}
                                            disabled={isProcessing}
                                            isLoading={isProcessing}
                                            className="w-full max-w-xs"
                                        >
                                            {isProcessing ? progressMessage || 'Compressing...' : 'Compress PDF'}
                                        </Button>
                                        {(compressionLevel === 'extreme' || compressionLevel === 'recommended') && (
                                            <p className="text-xs text-amber-600 mt-2 text-center max-w-md">
                                                {compressionLevel === 'extreme' ? 'Maximum' : 'High'} compression mode converts pages to images
                                            </p>
                                        )}
                                        {isProcessing && progress > 0 && (
                                            <div className="w-full max-w-xs mt-4 bg-border-medium rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-1.5 transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        )}
                                        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                                    </>
                                ) : (
                                    <div className="w-full bg-green-500/5/50 border border-green-100 rounded-xl p-6 flex flex-col items-center animate-fade-up">
                                        <div className="h-12 w-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-text-primary mb-2">Compression Complete!</h3>

                                        <div className="flex items-center gap-8 my-4 text-center">
                                            <div>
                                                <p className="text-xs text-text-muted uppercase tracking-wider">New Size</p>
                                                <p className="text-2xl font-bold text-green-500">{formatSize(compressedSize)}</p>
                                            </div>
                                            <div className="h-8 w-px bg-border-medium" />
                                            <div>
                                                <p className="text-xs text-text-muted uppercase tracking-wider">Saved</p>
                                                <p className="text-2xl font-bold text-text-primary">{calculateSavings()}%</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 mt-4">
                                            <Button variant="outline" onClick={() => { setFile(null); setCompressedPdfUrl(null); }}>
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Compress Another
                                            </Button>
                                            <a href={compressedPdfUrl} download={`compressed_${file.name}`}>
                                                <Button>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Result
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
