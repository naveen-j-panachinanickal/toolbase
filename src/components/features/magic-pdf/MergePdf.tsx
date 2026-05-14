'use client';
/**
 * MergePdf — unified component for both the direct tool page and the pipeline INP.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Standalone mode  (direct tool):  <MergePdf />             │
 * │   → Merge button → download result                         │
 * │                                                             │
 * │  Interaction mode (pipeline INP): <MergePdf                │
 * │       files={[...]} onConfirm={fn} onCancel={fn} />        │
 * │   → Pre-seeded file grid, Confirm Order button              │
 * │   → No execution here — handled by the pipeline engine     │
 * └─────────────────────────────────────────────────────────────┘
 *
 * The registry's getInteractionComponent points here, so there is
 * zero code duplication between the two use-cases.
 */
import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/ui/FileUploader';
import { PdfPreview } from '@/components/ui/PdfPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
    Trash2, FilePlus, Merge, Download, Eye,
    ArrowDown, ArrowUp, CheckCheck, X,
} from 'lucide-react';
import { useTIPTool } from '@/hooks/useTIPTool';
import { createTimer } from '@/lib/performance';
import { cn } from '@/lib/utils';
import type { TIPInteractionProps } from '@/tip/protocol';

/** Props for MergePdf — all fields optional so it works as a bare <MergePdf /> too */
export type MergePdfProps = Partial<TIPInteractionProps>;

export default function MergePdf({
    files: seedFiles,
    config,
    onConfirm,
    onCancel,
}: MergePdfProps = {}) {
    /** true when used as a pipeline INP component */
    const isInteractionMode = typeof onConfirm === 'function';

    const [files, setFiles] = useState<File[]>(() => {
        let initial = seedFiles ?? [];
        if (config && config.fileOrder) {
            try {
                const order: string[] = JSON.parse(config.fileOrder as string);
                const orderedFiles = [];
                const remaining = [...initial];
                for (const name of order) {
                    const idx = remaining.findIndex(f => f.name === name);
                    if (idx !== -1) {
                        orderedFiles.push(remaining[idx]);
                        remaining.splice(idx, 1);
                    }
                }
                initial = [...orderedFiles, ...remaining];
            } catch (e) {
                // ignore
            }
        }
        return initial;
    });
    const { execute, isProcessing, progress, progressMessage } = useTIPTool('magic-pdf/merge');
    const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);

    // ── File management ──────────────────────────────────────────────────────────

    const addFiles = (newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles]);
        setMergedPdfUrl(null);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setMergedPdfUrl(null);
    };

    const moveFile = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === files.length - 1) return;
        setFiles(prev => {
            const next = [...prev];
            const target = direction === 'up' ? index - 1 : index + 1;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
        setMergedPdfUrl(null);
    };

    // ── Actions (mode-specific) ───────────────────────────────────────────────────

    /** Standalone: execute the merge via the TIP worker */
    const handleMerge = async () => {
        if (files.length < 2) return;
        const timer = createTimer();
        timer.start();
        try {
            const outputFiles = await execute(files, {});
            timer.stop('magic-pdf');
            if (outputFiles && outputFiles.length > 0) {
                setMergedPdfUrl(URL.createObjectURL(outputFiles[0]));
            }
        } catch (err) {
            console.error('Failed to merge PDFs:', err);
        }
    };

    /** Interaction: confirm the chosen file order back to the pipeline */
    const handleConfirm = () => {
        if (files.length < 2 || !onConfirm) return;
        onConfirm({
            files,
            config: { fileOrder: JSON.stringify(files.map(f => f.name)) }
        });
    };

    // ── Shared file card grid ─────────────────────────────────────────────────────

    const fileGrid = (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <AnimatePresence>
                {files.map((file, index) => (
                    <m.div
                        key={`${file.name}-${index}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 25 }}
                        className="group perspective-1000"
                    >
                        <Card className={cn(
                            "relative overflow-hidden transition-all duration-300 ease-out",
                            "bg-linear-to-br from-(--surface) via-(--surface-overlay) to-(--surface)",
                            "border-2 border-(--border-medium) hover:border-(--primary)/60",
                            "hover:shadow-xl hover:shadow-(--primary)/10",
                            "h-[260px] flex flex-col"
                        )}>
                            {/* Order badge with gradient */}
                            <div className="absolute top-3 left-3 z-20">
                                <div className={cn(
                                    "w-7 h-7 rounded-xl flex items-center justify-center",
                                    "bg-linear-to-br from-(--primary) to-(--primary) opacity-80",
                                    "text-white font-bold text-sm shadow-lg shadow-(--primary) opacity-30",
                                    "transition-transform duration-300 group-hover:scale-110"
                                )}>
                                    {index + 1}
                                </div>
                            </div>

                            {/* Action buttons with frosted glass */}
                            <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-surface-elevated/90 backdrop-blur-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    <button
                                        onClick={() => moveFile(index, 'up')}
                                        disabled={index === 0}
                                        className="p-2 hover:bg-(--surface-hover) rounded-lg disabled:opacity-30 transition-all hover:scale-110 active:scale-95"
                                        title="Move up"
                                    >
                                        <ArrowUp className="w-4 h-4 text-(--text-secondary) hover:text-(--primary)" />
                                    </button>
                                    <button
                                        onClick={() => moveFile(index, 'down')}
                                        disabled={index === files.length - 1}
                                        className="p-2 hover:bg-(--surface-hover) rounded-lg disabled:opacity-30 transition-all hover:scale-110 active:scale-95"
                                        title="Move down"
                                    >
                                        <ArrowDown className="w-4 h-4 text-(--text-secondary) hover:text-(--primary)" />
                                    </button>
                                    <button
                                        onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                                        className="p-2 hover:bg-(--primary) opacity-10 rounded-lg transition-all hover:scale-110 active:scale-95"
                                        title="Preview"
                                    >
                                        <Eye className="w-4 h-4 text-(--text-secondary) hover:text-(--primary)" />
                                    </button>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-2 hover:bg-red-500 opacity-10 rounded-lg transition-all hover:scale-110 active:scale-95"
                                        title="Remove"
                                    >
                                        <Trash2 className="w-4 h-4 text-(--text-secondary) hover:text-red-600" />
                                    </button>
                                </div>
                            </div>

                            {/* PDF Preview with gradient background */}
                            <div className="flex-1 bg-linear-to-br from-(--surface-secondary) to-(--surface) flex items-center justify-center p-4 overflow-hidden relative">
                                {/* Subtle grid pattern background */}
                                <div className="absolute inset-0 opacity-[0.03]" style={{
                                    backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)',
                                    backgroundSize: '20px 20px'
                                }} />
                                <div className="relative z-10 w-full h-full">
                                    <PdfPreview file={file} scale={0.6} className="shadow-lg max-h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                                </div>
                            </div>

                            {/* File info footer */}
                            <div className="p-3 bg-linear-to-r from-(--surface-overlay) via-(--surface-secondary) to-(--surface-overlay) backdrop-blur-sm border-t border-(--border-subtle)">
                                <p className="text-sm font-semibold text-text-primary truncate" title={file.name}>
                                    {file.name}
                                </p>
                                <p className="text-xs text-text-muted font-medium mt-0.5">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>

                            {/* Hover glow effect */}
                            <div className="absolute inset-0 bg-linear-to-t from-(--primary)/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </Card>
                    </m.div>
                ))}
            </AnimatePresence>
        </div>
    );

    // ── Workspace (files loaded) ──────────────────────────────────────────────────

    const workspace = (
        <m.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={isInteractionMode ? 'flex flex-col gap-6 h-full' : 'space-y-6'}
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-xl font-semibold">
                    {files.length} PDF{files.length !== 1 ? 's' : ''} selected — reorder as needed
                </h2>
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById('merge-add-more')?.click()}
                    >
                        <FilePlus className="w-4 h-4 mr-2" />
                        Add More
                    </Button>
                    <input
                        id="merge-add-more"
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,application/pdf"
                        onChange={(e) => {
                            if (e.target.files) addFiles(Array.from(e.target.files));
                            e.target.value = '';
                        }}
                    />
                    <Button variant="danger" size="sm" onClick={() => { setFiles([]); setMergedPdfUrl(null); }}>
                        Clear All
                    </Button>
                </div>
            </div>

            {/* File grid */}
            <div className={isInteractionMode ? 'flex-1 overflow-y-auto min-h-0 pb-2' : ''}>
                {fileGrid}
            </div>

            {/* ── Mode-specific action bar ── */}
            {isInteractionMode ? (
                /* Interaction: confirm / cancel */
                <div className="flex items-center justify-end gap-3 shrink-0 pt-2 border-t border-border-subtle">
                    {files.length < 2 && (
                        <span className="text-sm text-amber-500 mr-auto">Add at least one more PDF to confirm.</span>
                    )}
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={files.length < 2} className="gap-2">
                        <CheckCheck className="w-4 h-4" />
                        Confirm Order ({files.length} PDFs)
                    </Button>
                </div>
            ) : (
                /* Standalone: floating merge button */
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
                    <AnimatePresence>
                        {files.length > 0 && !mergedPdfUrl && (
                            <m.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                            >
                                <Button
                                    size="lg"
                                    onClick={handleMerge}
                                    disabled={files.length < 2 || isProcessing}
                                    className="shadow-lg shadow-primary/25 rounded-2xl flex flex-col items-center justify-center p-6 h-auto"
                                    isLoading={isProcessing}
                                >
                                    <div className="flex items-center">
                                        <Merge className="w-5 h-5 mr-2" />
                                        {files.length < 2 ? 'Add at least 2 files' : isProcessing ? (progressMessage || 'Merging PDFs…') : 'Merge PDFs'}
                                    </div>
                                    {isProcessing && progress > 0 && (
                                        <div className="w-full mt-2 bg-surface-elevated/20 rounded-full h-1 overflow-hidden">
                                            <div className="bg-surface-elevated/80 h-1 transition-all duration-300" style={{ width: `${progress}%` }} />
                                        </div>
                                    )}
                                </Button>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </m.div>
    );

    // ── Empty state (upload prompt) ───────────────────────────────────────────────

    const uploadPrompt = (
        <m.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="p-8">
                <div className="text-center mb-8">
                    <Merge className="w-10 h-10 mx-auto mb-3 text-text-muted" />
                    <h2 className="text-2xl font-semibold mb-2">Upload PDFs to Start</h2>
                    <p className="text-text-muted">
                        {isInteractionMode
                            ? 'Add PDFs and confirm their order for the pipeline.'
                            : 'Combine multiple PDF files into one document.'}
                    </p>
                </div>
                <FileUploader onFilesSelected={addFiles} accept=".pdf,application/pdf" multiple className="max-w-2xl mx-auto" />
            </Card>
        </m.div>
    );

    // ── Standalone: merged result overlay ────────────────────────────────────────

    const resultOverlay = !isInteractionMode && mergedPdfUrl && (
        <AnimatePresence>
            <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
                <Card className="p-0 bg-(--surface-overlay) border border-(--border-subtle) shadow-sm overflow-hidden">
                <div className="border-b border-(--border-subtle) bg-linear-to-r from-sky-500/5 via-cyan-500/5 to-transparent px-5 py-4">
                        <div>
                            <h3 className="text-xl font-bold text-text-primary">PDFs Merged Successfully!</h3>
                            <p className="text-sm text-text-muted">Your document is ready to download.</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setMergedPdfUrl(null)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="flex-1 bg-surface-secondary p-8 flex items-center justify-center min-h-[300px]">
                        <iframe src={`${mergedPdfUrl}#toolbar=0`} className="w-full h-full shadow-lg rounded-lg border border-border-medium" title="Merged PDF Preview" />
                    </div>
                    <div className="p-6 border-t border-border-subtle bg-surface-secondary/50 flex gap-4 justify-end">
                        <Button variant="outline" onClick={() => window.open(mergedPdfUrl, '_blank')}>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                        </Button>
                        <a href={mergedPdfUrl} download="merged-document.pdf">
                            <Button>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                        </a>
                    </div>
                </Card>
            </m.div>
        </AnimatePresence>
    );

    // ── Root layout (different container per mode) ────────────────────────────────

    return (
        <div className={isInteractionMode ? 'w-full h-full flex flex-col' : 'w-full max-w-5xl mx-auto space-y-8'}>
            <AnimatePresence mode="wait">
                {files.length === 0 ? uploadPrompt : workspace}
            </AnimatePresence>

            {resultOverlay}
        </div>
    );
}
