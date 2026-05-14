'use client';
/**
 * SplitPdf — unified component for both the direct tool page and the pipeline INP.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Standalone mode  (direct tool):  <SplitPdf />                     │
 * │   → File upload → visual page selector → split → download results  │
 * │                                                                     │
 * │  Interaction mode (pipeline INP): <SplitPdf                        │
 * │       files={[pdf]} onConfirm={fn} onCancel={fn} />               │
 * │   → Pre-seeded with upstream file, visual selector,                │
 * │     "Confirm Split Points" saves pageRanges into node config       │
 * │   → No execution — pipeline engine handles that                    │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Mode is detected by the presence of `onConfirm`.
 */
import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/ui/FileUploader';
import { PdfPreview } from '@/components/ui/PdfPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
    Scissors, Download, RefreshCw,
    SplitSquareHorizontal, Eye, CheckCheck,
} from 'lucide-react';
import { useTIPTool } from '@/hooks/useTIPTool';
import type { TIPInteractionProps } from '@/tip/protocol';

/** Props for SplitPdf — all optional so it works as a bare <SplitPdf /> */
export type SplitPdfProps = Partial<TIPInteractionProps>;

export default function SplitPdf({
    files: seedFiles,
    config: seedConfig,
    onConfirm,
    onCancel,
}: SplitPdfProps = {}) {
    /** true when rendered inside the pipeline InteractionModal */
    const isInteractionMode = typeof onConfirm === 'function';

    // ── File state ───────────────────────────────────────────────────────────────
    const [file, setFile] = useState<File | null>(seedFiles?.[0] ?? null);
    const [numPages, setNumPages] = useState(0);
    const [pdfDocument, setPdfDocument] = useState<any>(null);

    // ── Split state ──────────────────────────────────────────────────────────────
    // Split indices = 0-based page indices AFTER which to insert a split
    const [splitIndices, setSplitIndices] = useState<number[]>(() => {
        if (seedConfig && seedConfig.pageRanges) {
            try {
                const ranges = (seedConfig.pageRanges as string).split(',');
                const indices: number[] = [];
                for (let i = 0; i < ranges.length - 1; i++) {
                    const range = ranges[i];
                    const parts = range.split('-');
                    const endPage = parseInt(parts[parts.length - 1], 10);
                    if (!isNaN(endPage)) {
                        indices.push(endPage - 1);
                    }
                }
                return indices.sort((a, b) => a - b);
            } catch (e) {
                // ignore
            }
        }
        return [];
    });

    // ── Standalone state ─────────────────────────────────────────────────────────
    const { execute, isProcessing, progress, progressMessage } = useTIPTool('magic-pdf/split');
    const [splitResult, setSplitResult] = useState<{ name: string; url: string }[]>([]);

    // ── Load PDF whenever file changes ───────────────────────────────────────────
    useEffect(() => {
        if (!file) {
            setPdfDocument(null);
            setNumPages(0);
            setSplitIndices([]);
            setSplitResult([]);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                if (typeof window !== 'undefined' && 'Worker' in window) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc =
                        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
                }
                const buf = await file.arrayBuffer();
                const doc = await pdfjsLib.getDocument({ data: buf }).promise;
                if (!cancelled) {
                    setPdfDocument(doc);
                    setNumPages(doc.numPages);
                }
            } catch (e) {
                console.error('Error loading PDF', e);
            }
        })();

        return () => { cancelled = true; };
    }, [file]);

    // ── File select ──────────────────────────────────────────────────────────────
    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) setFile(files[0]);
    };

    // ── Split point toggle ───────────────────────────────────────────────────────
    const toggleSplit = (pageIndex: number) => {
        setSplitIndices(prev =>
            prev.includes(pageIndex)
                ? prev.filter(i => i !== pageIndex)
                : [...prev, pageIndex].sort((a, b) => a - b)
        );
        setSplitResult([]);
    };

    // ── Compute page ranges from split indices ───────────────────────────────────
    const computePageRanges = (): string => {
        const groups: number[][] = [];
        let start = 0;
        [...splitIndices, numPages - 1].forEach(end => {
            const group: number[] = [];
            for (let i = start; i <= end; i++) group.push(i);
            groups.push(group);
            start = end + 1;
        });
        return groups.map(g =>
            g.length === 1 ? `${g[0] + 1}` : `${g[0] + 1}-${g[g.length - 1] + 1}`
        ).join(',');
    };

    // ── Standalone: execute split ────────────────────────────────────────────────
    const handleSplit = async () => {
        if (!file || splitIndices.length === 0) return;
        try {
            const pageRanges = computePageRanges();
            const outputFiles = await execute([file], { pageRanges });
            if (outputFiles) {
                setSplitResult(outputFiles.map(f => ({
                    name: f.name,
                    url: URL.createObjectURL(f),
                })));
            }
        } catch (err) {
            console.error('Failed to split PDF', err);
        }
    };

    // ── Interaction: confirm split points back to the pipeline ───────────────────
    const handleConfirm = () => {
        if (!file || !onConfirm) return;
        onConfirm({
            files: [file],
            config: { pageRanges: computePageRanges() },
        });
    };

    // ── Shared page selector UI ──────────────────────────────────────────────────
    const pageSelector = (
        <div className="bg-gradient-to-b from-gray-50/80 to-white/50 p-4 sm:p-6 rounded-2xl border border-border-medium/60 shadow-sm">
            <p className="text-center text-sm text-text-muted mb-4 sm:mb-6 font-medium">
                {isInteractionMode
                    ? 'Tap the scissors between pages to set split points, then confirm.'
                    : 'Tap the scissors to split the document at that point.'}
            </p>

            <div className="flex flex-wrap gap-y-4 gap-x-1 sm:gap-x-2 justify-center">
                {Array.from({ length: numPages }).map((_, i) => (
                    <React.Fragment key={i}>
                        <div className="relative group">
                            <Card className={cn(
                                "p-1.5 sm:p-2 flex flex-col items-center gap-1.5 sm:gap-2",
                                "transition-all duration-200 relative overflow-visible",
                                "hover:shadow-lg hover:scale-105 hover:border-red-200/50",
                                "w-[100px] h-[135px] sm:w-[140px] sm:h-[180px]"
                            )}>
                                <div className="w-full h-full bg-surface-elevated rounded-lg border border-border-subtle overflow-hidden relative shadow-sm">
                                    <PdfPreview
                                        pdfDocument={pdfDocument}
                                        pageNumber={i + 1}
                                        scale={0.4}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <span className="text-[10px] sm:text-xs font-medium text-text-muted bg-surface-secondary/80 px-2 py-0.5 rounded-full">
                                    Page {i + 1}
                                </span>
                            </Card>
                        </div>

                        {/* Split point button between pages */}
                        {i < numPages - 1 && (
                            <div className="flex flex-col items-center justify-center -mx-0.5 sm:-mx-1 z-10">
                                <button
                                    onClick={() => toggleSplit(i)}
                                    className={cn(
                                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 border-2 shadow-sm",
                                        "active:scale-90 touch-manipulation",
                                        splitIndices.includes(i)
                                            ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-700 text-background scale-110 shadow-red-200'
                                            : 'bg-surface-elevated border-border-medium text-text-muted hover:text-red-500 hover:border-red-300 hover:scale-105 hover:shadow-md'
                                    )}
                                    title="Split here"
                                    aria-label={`Split after page ${i + 1}`}
                                >
                                    {splitIndices.includes(i)
                                        ? <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform rotate-90" />
                                        : <SplitSquareHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50 hover:opacity-100" />
                                    }
                                </button>
                                {splitIndices.includes(i) && (
                                    <div className="h-full w-0.5 bg-gradient-to-b from-red-400/30 via-red-500/40 to-red-400/30 absolute -z-10" />
                                )}
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );

    // ── Empty state (upload prompt) ───────────────────────────────────────────────
    const uploadPrompt = (
        <m.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            <Card className="p-6 sm:p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 sm:w-12 sm:h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center shadow-inner">
                        <Scissors className="w-8 h-8 sm:w-6 sm:h-6 text-red-500" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-text-primary">
                        {isInteractionMode ? 'Select PDF to Split' : 'Split PDF Document'}
                    </h2>
                    <p className="text-sm sm:text-base text-text-muted max-w-md mx-auto">
                        {isInteractionMode
                            ? 'Upload the PDF you want to split in the pipeline, then mark the split points.'
                            : 'Extract pages or split your document into multiple files.'}
                    </p>
                </div>
                <FileUploader
                    onFilesSelected={handleFileSelected}
                    accept=".pdf,application/pdf"
                    multiple={false}
                    className="max-w-full sm:max-w-2xl mx-auto"
                />
            </Card>
        </m.div>
    );

    // ── Workspace (file loaded) ───────────────────────────────────────────────────
    const workspace = (
        <m.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={isInteractionMode ? 'flex flex-col gap-5 h-full' : 'space-y-6'}
        >
            {/* Sticky toolbar */}
            <div className={cn(
                'flex items-center justify-between p-3 sm:p-4 rounded-xl border shadow-sm',
                isInteractionMode ? 'shrink-0 bg-surface-elevated' : 'bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-30',
                isInteractionMode ? 'border-border-medium' : 'border-border-medium/60'
            )}>
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className={cn(
                        "h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0",
                        isInteractionMode ? 'bg-red-50 text-red-600' : 'bg-gradient-to-br from-red-50 to-red-100 text-red-600 shadow-sm'
                    )}>
                        <Scissors className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-text-primary truncate text-xs sm:text-sm" title={file?.name}>
                            {file?.name}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-text-muted font-medium whitespace-nowrap">
                            {numPages} Pages · {((file?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                            {splitIndices.length > 0 && <span className="hidden sm:inline text-red-500"> · {splitIndices.length + 1} segments</span>}
                        </p>
                    </div>
                </div>

                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                    {!isInteractionMode && (
                        <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="hidden sm:flex">
                            Change
                        </Button>
                    )}

                    {/* ── Mode-specific action ── */}
                    {isInteractionMode ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={onCancel} className="hidden sm:flex">Cancel</Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={splitIndices.length === 0}
                                size="sm"
                                className="gap-1.5 sm:gap-2"
                            >
                                <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Confirm</span>
                                <span className="sm:hidden">{splitIndices.length + 1}</span>
                            </Button>
                        </>
                    ) : splitResult.length > 0 ? (
                        <Button onClick={() => setSplitResult([])} variant="outline" size="sm">
                            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Reset</span>
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSplit}
                            disabled={splitIndices.length === 0 || isProcessing}
                            isLoading={isProcessing}
                            size="sm"
                            className="gap-1.5 sm:gap-2"
                        >
                            <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">
                                {isProcessing ? progressMessage || 'Splitting…' : `Split (${splitIndices.length + 1})`}
                            </span>
                            <span className="sm:hidden">{splitIndices.length + 1}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Download results (standalone only) */}
            {!isInteractionMode && splitResult.length > 0 && (
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                >
                    {splitResult.map((result, i) => (
                        <Card
                            key={i}
                            className={cn(
                                "p-3 sm:p-4 border-2 transition-all duration-200",
                                "bg-gradient-to-br from-green-50/80 via-green-50/40 to-white",
                                "border-green-200/60 hover:border-green-300 hover:shadow-md"
                            )}
                        >
                            <div className="flex flex-col gap-2.5">
                                {/* File info row */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={cn(
                                        "h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                        "bg-surface-elevated border-2 border-green-200/60"
                                    )}>
                                        <span className="font-bold text-green-500 text-base sm:text-lg">{i + 1}</span>
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-semibold text-text-primary truncate text-sm sm:text-base">{result.name}</span>
                                        <span className="text-[10px] sm:text-xs text-green-500 font-medium flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Ready to download
                                        </span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 pt-1 border-t border-green-100/50">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => window.open(result.url, '_blank')}
                                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                                    >
                                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:ml-1.5 sm:inline">Preview</span>
                                    </Button>
                                    <a href={result.url} download={result.name} className="flex-1 sm:flex-none">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={cn(
                                                "w-full sm:w-auto flex-1 sm:flex-none text-xs sm:text-sm font-medium",
                                                "bg-surface-elevated hover:bg-green-600 hover:text-background hover:border-green-600",
                                                "border-green-200 text-green-700 transition-all duration-200"
                                            )}
                                        >
                                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
                                            <span>Download</span>
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {/* Success summary */}
                    <m.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="sm:col-span-2 lg:col-span-3"
                    >
                        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border border-green-200/40 flex items-center justify-center gap-2 text-green-700">
                            <span className="text-sm sm:text-base font-medium">
                                ✓ Successfully split into {splitResult.length} file{splitResult.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    </m.div>
                </m.div>
            )}

            {/* Page selector (shown when no results yet) */}
            {(isInteractionMode || !splitResult.length) && (
                <div className={isInteractionMode ? 'flex-1 overflow-y-auto min-h-0' : ''}>
                    {numPages > 0 ? pageSelector : (
                        <div className="flex items-center justify-center h-40 text-text-faint text-sm">
                            Loading pages…
                        </div>
                    )}
                </div>
            )}

            {/* Interaction mode: hint at bottom */}
            {isInteractionMode && splitIndices.length === 0 && numPages > 0 && (
                <p className="text-xs text-amber-600 text-center shrink-0">
                    Select at least one split point to confirm.
                </p>
            )}
        </m.div>
    );

    // ── Root ─────────────────────────────────────────────────────────────────────
    return (
        <div className={cn(
            isInteractionMode ? 'w-full h-full flex flex-col' : 'w-full max-w-5xl mx-auto pb-8 sm:pb-20',
            !isInteractionMode && 'px-3 sm:px-0'
        )}>
            <AnimatePresence mode="wait">
                {!file ? uploadPrompt : workspace}
            </AnimatePresence>
        </div>
    );
}
