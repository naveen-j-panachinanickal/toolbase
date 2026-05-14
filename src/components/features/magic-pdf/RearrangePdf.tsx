'use client';
/**
 * RearrangePdf — unified component for the direct tool page and the pipeline INP.
 *
 * Standalone mode  (direct tool):   <RearrangePdf />
 *   → Reorder, rotate, delete pages → apply changes → download
 *
 * Interaction mode (pipeline INP):  <RearrangePdf files={[pdf]} onConfirm={fn} onCancel={fn} />
 *   → Pre-seeded with upstream file, same UI
 *   → Confirm saves pageOrder+operations as config (no execution here)
 */
import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import {
    Download,
    RefreshCw,
    RotateCw,
    Trash2,
    CheckCircle,
    CheckCheck,
    Undo2,
    ArrowUpDown,
    X,
    ChevronLeft,
    ChevronRight,
    Eye
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { rearrangePdf, getPdfPageCount, renderPdfPageToImage, PageOperation } from '@/lib/pdf-actions';
import type { TIPInteractionProps } from '@/tip/protocol';

export type RearrangePdfProps = Partial<TIPInteractionProps>;

interface PageItem {
    id: string;
    index: number;
    originalIndex: number;
    thumbnail: string | null;
    rotation: number;
    deleted: boolean;
}

export default function RearrangePdf({
    files: seedFiles,
    config,
    onConfirm,
    onCancel,
}: RearrangePdfProps = {}) {
    /**true when used inside the pipeline InteractionModal */
    const isInteractionMode = typeof onConfirm === 'function';

    const [file, setFile] = useState<File | null>(seedFiles?.[0] ?? null);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
    const [loadingThumbnails, setLoadingThumbnails] = useState(false);
    const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);

    // ── Load the PDF whenever file changes (covers seedFiles pre-seed and user picks) ──
    const loadFile = async (selectedFile: File) => {
        setResultPdfUrl(null);
        setIsLoading(true);
        setLoadingThumbnails(true);
        try {
            const pageCount = await getPdfPageCount(selectedFile);

            let initialOrder = Array.from({ length: pageCount }, (_, i) => i);
            let savedOperations: PageOperation[] = [];

            if (config && config.pageOrder) {
                try { initialOrder = JSON.parse(config.pageOrder as string); } catch (e) { /* ignore */ }
            }
            if (config && config.operations) {
                try { savedOperations = JSON.parse(config.operations as string); } catch (e) { /* ignore */ }
            }

            const allPagesModel = Array.from({ length: pageCount }, (_, i) => {
                const op = savedOperations.find(o => o.pageIndex === i);
                return {
                    id: `page-${i}`,
                    index: i,
                    originalIndex: i,
                    thumbnail: null,
                    rotation: op?.rotation ?? 0,
                    deleted: op?.delete ?? false,
                };
            });

            const orderedActivePages = initialOrder
                .map(originalIdx => allPagesModel.find(p => p.originalIndex === originalIdx))
                .filter(Boolean) as PageItem[];

            const deletedPagesList = allPagesModel.filter(p => p.deleted);
            const savedActiveIndices = new Set(initialOrder);
            const missingActivePages = allPagesModel.filter(p => !p.deleted && !savedActiveIndices.has(p.originalIndex));

            const pageItems = [...orderedActivePages, ...missingActivePages, ...deletedPagesList];

            setPages(pageItems);
            // Load thumbnails progressively
            for (let i = 0; i < pageCount; i++) {
                try {
                    const thumbnail = await renderPdfPageToImage(selectedFile, i, 1.5);
                    setPages(prev => prev.map(p => p.originalIndex === i ? { ...p, thumbnail } : p));
                } catch (err) {
                    console.error(`Failed to render page ${i}:`, err);
                }
            }
            setLoadingThumbnails(false);
        } catch (err) {
            console.error('Error loading PDF:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-load when file is set (covers seedFiles initial value)
    useEffect(() => {
        if (file) loadFile(file);
        else { setPages([]); setResultPdfUrl(null); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    /** Called by the FileUploader drop zone in standalone mode */
    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) setFile(files[0]);
    };

    const handleRotatePage = (pageId: string) => {
        setPages(prev => prev.map(p =>
            p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p
        ));
    };

    const handleDeletePage = (pageId: string) => {
        setPages(prev => prev.map(p =>
            p.id === pageId ? { ...p, deleted: true } : p
        ));
    };

    const handleRestorePage = (pageId: string) => {
        setPages(prev => prev.map(p =>
            p.id === pageId ? { ...p, deleted: false } : p
        ));
    };

    const handleResetAll = () => {
        setPages(prev => [...prev]
            .sort((a, b) => a.originalIndex - b.originalIndex)
            .map(p => ({ ...p, rotation: 0, deleted: false }))
        );
    };

    const handleReorder = (fromIndex: number, toIndex: number) => {
        setPages(prev => {
            const activePagesOnly = prev.filter(p => !p.deleted);
            const deletedPagesOnly = prev.filter(p => p.deleted);

            const newActivePages = [...activePagesOnly];
            const [movedPage] = newActivePages.splice(fromIndex, 1);
            newActivePages.splice(toIndex, 0, movedPage);

            return [...newActivePages, ...deletedPagesOnly];
        });
    };

    // ── Standalone: execute rearrangement via pdf-lib ─────────────────────────
    const handleProcess = async () => {
        if (!file) return;
        setIsProcessing(true);
        try {
            const activePages = pages.filter(p => !p.deleted);
            const newOrder = activePages.map(p => p.originalIndex);
            const operations: PageOperation[] = pages.map(p => ({
                pageIndex: p.originalIndex,
                rotation: p.rotation,
                delete: p.deleted,
            }));
            const resultBytes = await rearrangePdf(file, newOrder, operations);
            const blob = new Blob([resultBytes as any], { type: 'application/pdf' });
            setResultPdfUrl(URL.createObjectURL(blob));
        } catch (err) {
            console.error('Error processing PDF:', err);
            alert('Failed to process PDF: ' + (err as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Interaction: confirm page arrangement to the pipeline ──────────────────
    const handleConfirm = () => {
        if (!file || !onConfirm) return;
        const activePages = pages.filter(p => !p.deleted);
        const newOrder = activePages.map(p => p.originalIndex);
        const operations: PageOperation[] = pages.map(p => ({
            pageIndex: p.originalIndex,
            rotation: p.rotation,
            delete: p.deleted,
        }));
        onConfirm({
            files: [file],
            config: {
                pageOrder: JSON.stringify(newOrder),
                operations: JSON.stringify(operations),
            },
        });
    };

    const activePages = pages.filter(p => !p.deleted);
    const deletedPages = pages.filter(p => p.deleted);
    const hasChanges = pages.some((p, idx) => {
        const activePagesOnly = pages.filter(pg => !pg.deleted);
        const currentPositionInActive = activePagesOnly.findIndex(pg => pg.id === p.id);
        return p.rotation !== 0 || p.deleted || (currentPositionInActive !== -1 && currentPositionInActive !== p.originalIndex);
    });

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
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
                                <h2 className="text-2xl font-semibold mb-2">Rearrange PDF Pages</h2>
                                <p className="text-text-muted">Reorder, rotate, and delete pages from your PDF.</p>
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
                        {/* Header */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                        <ArrowUpDown className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-text-primary">{file.name}</h3>
                                        <p className="text-sm text-text-muted">
                                            {activePages.length} page{activePages.length !== 1 ? 's' : ''}
                                            {deletedPages.length > 0 && ` • ${deletedPages.length} deleted`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {hasChanges && !resultPdfUrl && (
                                        <Button variant="ghost" onClick={handleResetAll}>
                                            <Undo2 className="w-4 h-4 mr-2" />
                                            Reset All
                                        </Button>
                                    )}
                                    {!resultPdfUrl && !isInteractionMode && (
                                        <Button variant="ghost" onClick={() => setFile(null)}>
                                            Change File
                                        </Button>
                                    )}
                                    {/* Mode-specific action */}
                                    {isInteractionMode && (
                                        <>
                                            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                                            <Button onClick={handleConfirm} disabled={activePages.length === 0} className="gap-2">
                                                <CheckCheck className="w-4 h-4" />
                                                Confirm Arrangement ({activePages.length} pages)
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Result Section */}
                        {resultPdfUrl && (
                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="p-8 bg-green-500/5/50 border-green-100">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="h-16 w-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-text-primary mb-2">PDF Rearranged!</h3>
                                        <p className="text-text-muted mb-6">Your PDF has been successfully processed.</p>

                                        <div className="flex gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setFile(null);
                                                    setPages([]);
                                                    setResultPdfUrl(null);
                                                }}
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Process Another
                                            </Button>
                                            <a href={resultPdfUrl} download={`rearranged_${file.name}`}>
                                                <Button>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Result
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                </Card>
                            </m.div>
                        )}

                        {/* Pages Grid */}
                        {!resultPdfUrl && (
                            <>
                                <Card className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h4 className="font-semibold text-text-primary">Pages</h4>
                                            <p className="text-sm text-text-muted">
                                                {isInteractionMode
                                                    ? 'Drag pages to reorder, rotate, or delete.'
                                                    : 'Click and drag pages to reorder'}
                                            </p>
                                        </div>
                                        {/* Standalone Apply Changes button */}
                                        {!isInteractionMode && (
                                            <Button
                                                onClick={handleProcess}
                                                disabled={isProcessing || !hasChanges || activePages.length === 0}
                                                isLoading={isProcessing}
                                            >
                                                {isProcessing ? 'Processing...' : 'Apply Changes'}
                                            </Button>
                                        )}
                                    </div>

                                    {loadingThumbnails && (
                                        <div className="text-center py-8 text-text-muted">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block mr-2" />
                                            Loading page previews...
                                        </div>
                                    )}

                                    <DraggableGrid
                                        pages={activePages}
                                        onReorder={handleReorder}
                                        onRotate={handleRotatePage}
                                        onDelete={handleDeletePage}
                                        onPreview={(index) => setPreviewPageIndex(index)}
                                    />

                                    {activePages.length === 0 && !loadingThumbnails && (
                                        <div className="text-center py-12 text-text-faint">
                                            <p>All pages have been deleted. Restore some pages to continue.</p>
                                        </div>
                                    )}
                                </Card>

                                {/* Deleted Pages */}
                                {deletedPages.length > 0 && (
                                    <Card className="p-6 bg-red-50/30 border-red-100">
                                        <h4 className="font-semibold text-text-primary mb-4">Deleted Pages</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {deletedPages.map((page) => (
                                                <div key={page.id} className="relative opacity-60">
                                                    <PageCard
                                                        page={page}
                                                        onRotate={() => { }}
                                                        onDelete={() => { }}
                                                        isDeleted
                                                        isDragging={false}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="absolute inset-0 m-auto w-fit h-fit bg-surface-elevated"
                                                        onClick={() => handleRestorePage(page.id)}
                                                    >
                                                        <Undo2 className="w-3 h-3 mr-1" />
                                                        Restore
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </>
                        )}
                    </m.div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewPageIndex !== null && (
                    <PagePreviewModal
                        page={activePages[previewPageIndex]}
                        currentIndex={previewPageIndex}
                        totalPages={activePages.length}
                        onClose={() => setPreviewPageIndex(null)}
                        onNext={() => setPreviewPageIndex(prev =>
                            prev !== null && prev < activePages.length - 1 ? prev + 1 : prev
                        )}
                        onPrevious={() => setPreviewPageIndex(prev =>
                            prev !== null && prev > 0 ? prev - 1 : prev
                        )}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

interface DraggableGridProps {
    pages: PageItem[];
    onReorder: (fromIndex: number, toIndex: number) => void;
    onRotate: (pageId: string) => void;
    onDelete: (pageId: string) => void;
    onPreview: (index: number) => void;
}

const DraggableGrid = ({ pages, onReorder, onRotate, onDelete, onPreview }: DraggableGridProps) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Create a semi-transparent drag image
        if (e.currentTarget instanceof HTMLElement) {
            const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
            dragImage.style.opacity = '0.5';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 50, 50);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        }
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedIndex === null || draggedIndex === index) return;
        setOverIndex(index);
    };

    const handleDragLeave = () => {
        setOverIndex(null);
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && overIndex !== null && draggedIndex !== overIndex) {
            onReorder(draggedIndex, overIndex);
        }
        setDraggedIndex(null);
        setOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleDragEnd();
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {pages.map((page, index) => (
                <div
                    key={page.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    className={cn(
                        "relative group perspective-1000",
                        "transition-all duration-300 ease-out",
                        "touch-manipulation"
                    )}
                    style={{
                        transform: draggedIndex === index
                            ? 'scale(0.95) rotate(2deg)'
                            : overIndex === index && draggedIndex !== null && draggedIndex !== index
                                ? 'scale(1.05) rotate(-1deg)'
                                : 'scale(1) rotate(0deg)'
                    }}
                >
                    {/* Drop zone indicator */}
                    {overIndex === index && draggedIndex !== null && draggedIndex !== index && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-violet-400 to-purple-400 rounded-2xl opacity-60 animate-pulse blur-sm -z-10" />
                    )}
                    <PageCard
                        page={page}
                        onRotate={() => onRotate(page.id)}
                        onDelete={() => onDelete(page.id)}
                        onPreview={() => onPreview(index)}
                        isDragging={draggedIndex === index}
                    />
                </div>
            ))}
        </div>
    );
};

interface PageCardProps {
    page: PageItem;
    onRotate: () => void;
    onDelete: () => void;
    onPreview?: () => void;
    isDeleted?: boolean;
    isDragging?: boolean;
}

const PageCard = ({ page, onRotate, onDelete, onPreview, isDeleted = false, isDragging = false }: PageCardProps) => {
    return (
        <div
            className={cn(
                "group relative bg-surface-elevated rounded-2xl overflow-hidden select-none touch-none",
                "transition-all duration-300 ease-out",
                "border-2",
                isDeleted
                    ? "border-red-200 opacity-50 grayscale"
                    : cn(
                        "border-border-medium/80",
                        "hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10",
                        "active:shadow-2xl active:scale-105"
                    ),
                !isDeleted && "cursor-grab active:cursor-grabbing",
                isDragging && "shadow-2xl shadow-purple-500/30 ring-4 ring-purple-400/50 z-50"
            )}
        >
            {/* Gradient overlay on hover */}
            {!isDeleted && (
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
            )}

            {/* Page Number Badge with gradient */}
            <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
                <div className={cn(
                    "px-2.5 py-1.5 rounded-xl font-bold text-xs shadow-lg backdrop-blur-sm",
                    "bg-gradient-to-br from-gray-900/90 to-gray-800/90 text-background",
                    "transition-transform duration-300 group-hover:scale-110"
                )}>
                    {page.originalIndex + 1}
                </div>
            </div>

            {/* Rotation indicator badge */}
            {page.rotation !== 0 && !isDeleted && (
                <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                    <div className="px-2 py-1 rounded-lg bg-purple-500/90 text-background text-[10px] font-semibold shadow-md backdrop-blur-sm flex items-center gap-1">
                        <RotateCw className="w-3 h-3" />
                        {page.rotation}°
                    </div>
                </div>
            )}

            {/* Thumbnail container with glass effect */}
            <div
                className={cn(
                    "aspect-[1/1.414] flex items-center justify-center overflow-hidden pointer-events-none relative",
                    isDeleted ? "bg-red-50" : "bg-gradient-to-br from-gray-50 to-white"
                )}
                style={{ transform: `rotate(${page.rotation}deg)` }}
            >
                {/* Inner shadow border */}
                <div className="absolute inset-0 ring-1 ring-inset ring-gray-200/50 rounded-none" />

                {page.thumbnail ? (
                    <img
                        src={page.thumbnail}
                        alt={`Page ${page.originalIndex + 1}`}
                        className={cn(
                            "w-full h-full object-contain transition-transform duration-300",
                            "group-hover:scale-105"
                        )}
                        draggable={false}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                        <span className="text-xs text-text-faint font-medium">Loading...</span>
                    </div>
                )}
            </div>

            {/* Action Buttons with frosted glass background */}
            {!isDeleted && (
                <div className="absolute bottom-0 left-0 right-0 z-20">
                    <div className={cn(
                        "flex items-center justify-center gap-1.5 p-2.5",
                        "bg-gradient-to-t from-black/80 via-black/60 to-transparent",
                        "backdrop-blur-md",
                        "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0",
                        "transition-all duration-300 ease-out",
                        "pointer-events-none group-hover:pointer-events-auto"
                    )}>
                        {onPreview && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onPreview();
                                }}
                                draggable={false}
                                onDragStart={(e) => e.preventDefault()}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all duration-200",
                                    "bg-surface-elevated/90 hover:bg-blue-500 hover:text-background hover:shadow-lg hover:shadow-blue-500/30",
                                    "hover:scale-110 active:scale-95",
                                    "pointer-events-auto"
                                )}
                                title="Preview page"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onRotate();
                            }}
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            className={cn(
                                "p-2.5 rounded-xl transition-all duration-200",
                                "bg-surface-elevated/90 hover:bg-purple-500 hover:text-background hover:shadow-lg hover:shadow-purple-500/30",
                                "hover:scale-110 active:scale-95",
                                "pointer-events-auto"
                            )}
                            title="Rotate 90°"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onDelete();
                            }}
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            className={cn(
                                "p-2.5 rounded-xl transition-all duration-200",
                                "bg-surface-elevated/90 hover:bg-red-500 hover:text-background hover:shadow-lg hover:shadow-red-500/30",
                                "hover:scale-110 active:scale-95",
                                "pointer-events-auto"
                            )}
                            title="Delete page"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Drag handle indicator - subtle grip lines at top */}
            {!isDeleted && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex flex-col gap-1">
                        <div className="w-8 h-1 bg-border-medium rounded-full" />
                        <div className="w-8 h-1 bg-border-medium rounded-full" />
                    </div>
                </div>
            )}
        </div>
    );
};

// Preview Modal Component
interface PagePreviewModalProps {
    page: PageItem;
    currentIndex: number;
    totalPages: number;
    onClose: () => void;
    onNext: () => void;
    onPrevious: () => void;
}

const PagePreviewModal = ({ page, currentIndex, totalPages, onClose, onNext, onPrevious }: PagePreviewModalProps) => {
    const [zoom, setZoom] = useState(1.5);
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 0.25;

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && currentIndex < totalPages - 1) onNext();
            if (e.key === 'ArrowLeft' && currentIndex > 0) onPrevious();
            // Zoom with + and - keys
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
            }
            if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
            }
            // Reset zoom with 0
            if (e.key === '0') {
                e.preventDefault();
                setZoom(1.5);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, totalPages, onClose, onNext, onPrevious]);

    // Mouse wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY / 1000;
            setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
        }
    };

    // Reset zoom when page changes
    React.useEffect(() => {
        setZoom(1.5);
    }, [currentIndex]);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
    };

    const handleResetZoom = () => {
        setZoom(1.5);
    };

    return (
        <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-surface-elevated/10 hover:bg-surface-elevated/20 rounded-full transition-colors"
                title="Close (Esc)"
            >
                <X className="w-6 h-6 text-background" />
            </button>

            {/* Page Info */}
            <div className="absolute top-4 left-4 z-10 bg-black/50 text-background px-4 py-2 rounded-lg backdrop-blur-sm">
                <p className="text-sm font-medium">
                    Page {page.originalIndex + 1} of {totalPages}
                </p>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 text-background px-4 py-2 rounded-lg backdrop-blur-sm">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleZoomOut();
                    }}
                    disabled={zoom <= MIN_ZOOM}
                    className="p-2 hover:bg-surface-elevated/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Zoom Out (-)"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleResetZoom();
                    }}
                    className="px-3 py-1 hover:bg-surface-elevated/10 rounded transition-colors text-sm font-medium min-w-[60px]"
                    title="Reset Zoom (0)"
                >
                    {Math.round(zoom * 100)}%
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleZoomIn();
                    }}
                    disabled={zoom >= MAX_ZOOM}
                    className="p-2 hover:bg-surface-elevated/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Zoom In (+)"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                </button>

                <div className="ml-2 pl-2 border-l border-white/20 text-xs text-text-muted">
                    Ctrl+Scroll to zoom
                </div>
            </div>

            {/* Navigation Buttons */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrevious();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-surface-elevated/10 hover:bg-surface-elevated/20 rounded-full transition-colors"
                    title="Previous (←)"
                >
                    <ChevronLeft className="w-6 h-6 text-background" />
                </button>
            )}

            {currentIndex < totalPages - 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onNext();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-surface-elevated/10 hover:bg-surface-elevated/20 rounded-full transition-colors"
                    title="Next (→)"
                >
                    <ChevronRight className="w-6 h-6 text-background" />
                </button>
            )}

            {/* Preview Image Container with Scroll */}
            <div
                className="max-w-[90vw] max-h-[90vh] overflow-auto p-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                onClick={(e) => e.stopPropagation()}
                onWheel={handleWheel}
            >
                <m.div
                    key={`${page.id}-${zoom}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block"
                >
                    <div
                        className="bg-surface-elevated rounded-xl shadow-2xl overflow-hidden transition-transform duration-200"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                    >
                        {page.thumbnail ? (
                            <img
                                src={page.thumbnail}
                                alt={`Page ${page.originalIndex + 1}`}
                                className="max-w-none"
                                style={{
                                    transform: `rotate(${page.rotation}deg)`,
                                    maxHeight: '80vh',
                                    width: 'auto'
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center p-20">
                                <div className="w-12 h-12 border-4 border-border-medium border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Rotation indicator */}
                    {page.rotation !== 0 && (
                        <div className="mt-4 text-center">
                            <span className="inline-block bg-surface-elevated/10 text-background text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                                Rotated {page.rotation}°
                            </span>
                        </div>
                    )}
                </m.div>
            </div>
        </m.div>
    );
};
