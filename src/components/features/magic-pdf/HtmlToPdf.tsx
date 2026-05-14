'use client';

import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import {
    Download,
    CheckCircle,
    ArrowRightLeft,
    FileCode2,
    Code,
    Globe,
    Link as LinkIcon
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTIPTool } from '@/hooks/useTIPTool';
import { cn } from '@/lib/utils';

export default function HtmlToPdf() {
    const [mode, setMode] = useState<'file' | 'url'>('file');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const { execute, isProcessing, error, progress, progressMessage, tool } = useTIPTool('magic-pdf/html-to-pdf');

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setResultPdfUrl(null);
        }
    };

    const handleConvert = async () => {
        if (mode === 'file' && !file) return;
        if (mode === 'url' && !url) return;

        setIsFetching(true);
        setResultPdfUrl(null);

        try {
            let htmlContent = '';
            let filename = 'document';

            if (mode === 'file' && file) {
                htmlContent = await file.text();
                filename = file.name.replace(/\.[^/.]+$/, "");
            } else if (mode === 'url' && url) {
                try {
                    // Try direct fetch first
                    const response = await fetch(url);
                    if (response.ok) {
                        htmlContent = await response.text();
                    } else {
                        throw new Error('Direct fetch failed');
                    }
                } catch (e) {
                    // Fallback to a CORS proxy (demo only, usually you'd need your own backend)
                    // Using allorigins.win for demo purposes as it's more stable than cors-anywhere for public
                    try {
                        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                        const response = await fetch(proxyUrl);
                        const data = await response.json();
                        htmlContent = data.contents;
                    } catch (proxyErr) {
                        alert("Unable to fetch website content due to CORS security. Please save the page as HTML and upload it instead.");
                        setIsFetching(false);
                        return;
                    }
                }
                const urlObj = new URL(url);
                filename = urlObj.hostname;
            }

            // Execute through TIP
            const htmlFile = new File([new Blob([htmlContent], { type: 'text/html' })], `${filename}.html`, { type: 'text/html' });

            setIsFetching(false);

            const outputFiles = await execute([htmlFile], { pageSize: 'A4' });

            if (outputFiles && outputFiles.length > 0) {
                const pdfUrl = URL.createObjectURL(outputFiles[0]);
                setResultPdfUrl(pdfUrl);
            }

        } catch (error: any) {
            console.error('Conversion failed:', error);
            setIsFetching(false);
            alert('Failed to convert HTML to PDF: ' + error.message);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
                {!resultPdfUrl ? (
                    <m.div
                        key="setup"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        <Card className="p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                                    <Globe className="w-8 h-8 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">HTML/Web to PDF</h2>
                                <p className="text-text-muted">Convert HTML files or webpages to PDF documents.</p>
                            </div>

                            <div className="flex justify-center mb-8">
                                <div className="bg-surface-secondary p-1 rounded-lg inline-flex gap-1">
                                    <button
                                        onClick={() => { setMode('file'); setResultPdfUrl(null); }}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                            mode === 'file' ? "bg-surface-elevated text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        Upload File
                                    </button>
                                    <button
                                        onClick={() => { setMode('url'); setResultPdfUrl(null); }}
                                        className={cn(
                                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                            mode === 'url' ? "bg-surface-elevated text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        Webpage URL
                                    </button>
                                </div>
                            </div>

                            {mode === 'file' ? (
                                !file ? (
                                    <FileUploader
                                        onFilesSelected={handleFileSelected}
                                        accept=".html,.htm"
                                        multiple={false}
                                    />
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl border border-border-subtle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                                    <Code className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-text-primary truncate max-w-[200px]">{file.name}</p>
                                                    <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(2)} KB</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Change File</Button>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LinkIcon className="h-5 w-5 text-text-faint" />
                                        </div>
                                        <input
                                            type="url"
                                            placeholder="https://example.com"
                                            className="block w-full pl-10 pr-3 py-3 border border-border-medium rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm shadow-sm"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                        />
                                    </div>
                                    <div className="bg-primary/5 p-4 rounded-lg flex gap-3 text-sm text-blue-700">
                                        <span>ℹ️</span>
                                        <p>Note: Some websites may block direct access. If this fails, please save the page as HTML (Ctrl+S) and use the "Upload File" tab.</p>
                                    </div>
                                </div>
                            )}

                            <Button
                                className="w-full h-12 text-lg shadow-lg hover:shadow-xl transition-all mt-6 bg-orange-600 hover:bg-orange-700"
                                onClick={handleConvert}
                                isLoading={isProcessing || isFetching}
                                disabled={(mode === 'file' && !file) || (mode === 'url' && !url)}
                            >
                                <ArrowRightLeft className="w-5 h-5 mr-2" />
                                {isProcessing ? progressMessage || 'Converting...' : 'Convert to PDF'}
                            </Button>
                        </Card>
                    </m.div>
                ) : (
                    <m.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <Card className="p-12 flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                <CheckCircle className="w-12 h-12" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-text-primary">Conversion Complete!</h3>
                                <p className="text-text-muted text-lg">Your content has been converted to PDF.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                                <a
                                    href={resultPdfUrl}
                                    download={mode === 'file' ? file?.name.replace(/\.html?$/i, '.pdf') : 'webpage.pdf'}
                                    className="flex-1"
                                >
                                    <Button className="w-full h-12 shadow-lg hover:shadow-xl transition-all">
                                        <Download className="w-5 h-5 mr-3" />
                                        Download PDF
                                    </Button>
                                </a>
                                <Button
                                    variant="outline"
                                    className="h-12"
                                    onClick={() => {
                                        setFile(null);
                                        setResultPdfUrl(null);
                                        // Don't reset URL/mode necessarily
                                    }}
                                >
                                    Convert Another
                                </Button>
                            </div>
                        </Card>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
