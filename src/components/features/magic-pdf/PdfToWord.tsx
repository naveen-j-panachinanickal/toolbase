'use client';

import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import {
    FileText,
    Download,
    RefreshCw,
    CheckCircle,
    ArrowRightLeft,
    FileCode
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTIPTool } from '@/hooks/useTIPTool';

export default function PdfToWord() {
    const [file, setFile] = useState<File | null>(null);
    const [resultDocUrl, setResultDocUrl] = useState<string | null>(null);
    const { execute, isProcessing } = useTIPTool('magic-pdf/pdf-to-word');

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setResultDocUrl(null);
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        try {
            const outputFiles = await execute([file], {});
            if (outputFiles && outputFiles.length > 0) {
                const url = URL.createObjectURL(outputFiles[0]);
                setResultDocUrl(url);
            }
        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Failed to convert PDF to Word');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
                {!resultDocUrl ? (
                    <m.div
                        key="setup"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        <Card className="p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                                    <FileCode className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">PDF to Word</h2>
                                <p className="text-text-muted">Convert your PDF documents to editable Microsoft Word files.</p>
                            </div>

                            {!file ? (
                                <FileUploader
                                    onFilesSelected={handleFileSelected}
                                    accept=".pdf"
                                    multiple={false}
                                />
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl border border-border-subtle">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-text-primary truncate max-w-[200px]">{file.name}</p>
                                                <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Change File</Button>
                                    </div>

                                    <div className="bg-primary/5/50 p-4 rounded-xl border border-blue-100 flex gap-3 italic text-sm text-blue-700">
                                        <div className="bg-primary/10 p-1 h-fit rounded">ℹ️</div>
                                        <p>The layout and formatting of the original PDF will be preserved as much as possible in the generated Word document.</p>
                                    </div>

                                    <Button
                                        className="w-full h-12 text-lg shadow-lg hover:shadow-xl transition-all"
                                        onClick={handleConvert}
                                        isLoading={isProcessing}
                                    >
                                        <ArrowRightLeft className="w-5 h-5 mr-2" />
                                        Convert to Word
                                    </Button>
                                </div>
                            )}
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
                                <p className="text-text-muted text-lg">Your PDF has been converted to an editable Word document.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                                <a
                                    href={resultDocUrl}
                                    download={file?.name.replace('.pdf', '.docx')}
                                    className="flex-1"
                                >
                                    <Button className="w-full h-12 shadow-lg hover:shadow-xl transition-all">
                                        <Download className="w-5 h-5 mr-3" />
                                        Download DOCX
                                    </Button>
                                </a>
                                <Button
                                    variant="outline"
                                    className="h-12"
                                    onClick={() => {
                                        setFile(null);
                                        setResultDocUrl(null);
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
