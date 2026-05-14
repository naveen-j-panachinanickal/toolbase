'use client';

import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import {
    Image as ImageIcon,
    Download,
    CheckCircle,
    ArrowRightLeft,
    Layers,
    Type,
    Settings2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTIPTool } from '@/hooks/useTIPTool';
import { cn } from '@/lib/utils';

export default function PdfToImage() {
    const [file, setFile] = useState<File | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [dpi, setDpi] = useState(150);
    const [format, setFormat] = useState<'JPEG' | 'PNG'>('JPEG');
    const { execute, isProcessing, error, progress, progressMessage, tool } = useTIPTool('magic-pdf/pdf-to-images');

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setImages([]);
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        try {
            const outputFiles = await execute([file], { dpi, format, image_format: format.toLowerCase() });

            if (outputFiles) {
                const imageUrls = outputFiles.map(f => {
                    return URL.createObjectURL(f);
                });
                setImages(imageUrls);
            }
        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Failed to convert PDF to images');
        }
    };

    const downloadImage = (url: string, index: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `page-${index + 1}.${format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAll = () => {
        images.forEach((url, index) => {
            setTimeout(() => downloadImage(url, index), index * 200);
        });
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
                {images.length === 0 ? (
                    <m.div
                        key="setup"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        <Card className="p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                                    <ImageIcon className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">PDF to Image</h2>
                                <p className="text-text-muted">Convert each PDF page into a high-quality image file.</p>
                            </div>

                            {!file ? (
                                <FileUploader
                                    onFilesSelected={handleFileSelected}
                                    accept=".pdf"
                                    multiple={false}
                                />
                            ) : (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl border border-border-subtle">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                                                <Layers className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-text-primary truncate max-w-[300px]">{file.name}</p>
                                                <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Change File</Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                                <Settings2 className="w-4 h-4" />
                                                Image Quality (DPI)
                                            </label>
                                            <div className="flex gap-2">
                                                {[72, 150, 300].map((val) => (
                                                    <button
                                                        key={val}
                                                        onClick={() => setDpi(val)}
                                                        className={cn(
                                                            "flex-1 py-2 px-4 rounded-lg border text-sm transition-all",
                                                            dpi === val
                                                                ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                                                                : "bg-surface-elevated text-text-muted border-border-medium hover:border-indigo-300"
                                                        )}
                                                    >
                                                        {val === 72 ? 'Fast' : val === 150 ? 'Standard' : 'High Quality'} ({val})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" />
                                                Output Format
                                            </label>
                                            <div className="flex gap-2">
                                                {['JPEG', 'PNG'].map((f) => (
                                                    <button
                                                        key={f}
                                                        onClick={() => setFormat(f as any)}
                                                        className={cn(
                                                            "flex-1 py-2 px-4 rounded-lg border text-sm transition-all",
                                                            format === f
                                                                ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                                                                : "bg-surface-elevated text-text-muted border-border-medium hover:border-indigo-300"
                                                        )}
                                                    >
                                                        {f}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full h-12 text-lg shadow-lg hover:shadow-xl transition-all bg-indigo-600 hover:bg-indigo-700"
                                        onClick={handleConvert}
                                        isLoading={isProcessing}
                                    >
                                        <ArrowRightLeft className="w-5 h-5 mr-2" />
                                        {isProcessing ? progressMessage || `Converting...` : `Convert to ${format} Images`}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </m.div>
                ) : (
                    <m.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-text-primary">Conversion Complete!</h3>
                                <p className="text-text-muted">{images.length} pages converted to {format}</p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setImages([])}>Convert Another</Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={downloadAll}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download All
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {images.map((url, idx) => (
                                <m.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <div className="group relative bg-surface-elevated border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <div className="aspect-3/4 overflow-hidden bg-surface-secondary">
                                            <img src={url} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-3 flex items-center justify-between">
                                            <span className="text-xs font-bold text-text-muted">Page {idx + 1}</span>
                                            <button
                                                onClick={() => downloadImage(url, idx)}
                                                className="p-1.5 bg-surface-secondary text-text-muted rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </m.div>
                            ))}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
