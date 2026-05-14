'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import {
    Download,
    RefreshCw,
    CheckCircle,
    Type,
    Upload,
    Trash2,
    X,
    Move,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Plus,
    Square,
    Circle,
    Minus,
    Palette,
    MousePointer2,
    Pencil,
    Edit3,
    Eraser,
    FileType,
    Info,
    RotateCw,
    RotateCcw
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { PdfPreview } from '@/components/ui/PdfPreview';
import { magicPdfWorker } from '@/workers/instances';

type ElementType = 'text' | 'image' | 'shape' | 'drawing' | 'whiteout';
type ShapeType = 'rectangle' | 'circle' | 'line';

interface EditElement {
    id: string;
    type: ElementType;
    content?: string; // dataUrl for image/drawing, text for text
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    width: number; // percentage
    height: number; // percentage
    pageIndex: number;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
    shapeType?: ShapeType;
    strokeWidth?: number;
    opacity?: number;
    rotation?: number; // rotation in degrees
    existing?: boolean; // If it's an element detected from the original PDF
    originalContent?: string; // Track original text content
    originalRect?: [number, number, number, number]; // Coordinates in PDF points
    originalX?: number; // Original position percentages (before move)
    originalY?: number;
    originalWidth?: number;
    originalHeight?: number;
    moved?: boolean;
    redact?: boolean;
    content_changed?: boolean;
}

export default function EditPdf() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1);

    // Tools state
    const [activeTool, setActiveTool] = useState<ElementType | 'select'>('select');
    const [activeShapeType, setActiveShapeType] = useState<ShapeType>('rectangle');
    const [elements, setElements] = useState<EditElement[]>([]);
    const [detectedPages, setDetectedPages] = useState<Set<number>>(new Set());
    const [activeElementId, setActiveElementId] = useState<string | null>(null);

    // Global style state
    const [currentColor, setCurrentColor] = useState('#000000');
    const [currentFontSize, setCurrentFontSize] = useState(16);
    const [currentFontFamily, setCurrentFontFamily] = useState('Inter');
    const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Assume worker will be ready quickly, or we can explicitly check workerStatus if needed.
        setIsReady(true);
    }, []);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Reset editor when file change
    useEffect(() => {
        if (file) {
            setElements([]);
            setDetectedPages(new Set());
            setResultPdfUrl(null);
            setCurrentPage(1);
        }
    }, [file]);

    // Detect existing elements on the page
    useEffect(() => {
        if (!file || !isReady || detectedPages.has(currentPage - 1)) return;

        const detectElements = async () => {
            try {
                const fileBytes = await file.arrayBuffer();
                const results: any = await magicPdfWorker.execute('detect', { file_bytes: new Uint8Array(fileBytes), page_index: currentPage - 1 });
                if (results && Array.isArray(results.elements)) {
                    const { width: p_W, height: p_H } = results;
                    const newElements: EditElement[] = results.elements.map((res: any) => {
                        return {
                            id: res.id,
                            type: res.type,
                            content: res.content,
                            originalContent: res.content,
                            x: res.x,
                            y: res.y,
                            width: res.width,
                            height: res.height,
                            pageIndex: currentPage - 1,
                            existing: true,
                            originalRect: res.rect,
                            fontSize: res.fontSize,
                            color: res.color,
                            fontFamily: res.fontFamily,
                            textAlign: res.textAlign || 'left'
                        };
                    });
                    setElements(prev => [...prev.filter(el => !el.existing || el.pageIndex !== currentPage - 1), ...newElements]);
                }
                setDetectedPages(prev => new Set(prev).add(currentPage - 1));
            } catch (err) {
                console.error('Detection failed:', err);
            }
        };

        detectElements();
    }, [file, currentPage, isReady, detectedPages]);

    // Detect existing elements on the page


    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
        }
    };

    const handleCanvasResize = useCallback((w: number, h: number) => {
        setCanvasSize(prev => {
            if (prev.width === w && prev.height === h) return prev;
            return { width: w, height: h };
        });
    }, []);

    // Add Element Helpers
    const addElement = (type: ElementType, options: Partial<EditElement> = {}) => {
        const newElement: EditElement = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x: 50,
            y: 50,
            width: type === 'text' ? 15 : 20,
            height: type === 'text' ? 5 : 15,
            pageIndex: currentPage - 1,
            color: type === 'whiteout' ? '#FFFFFF' : currentColor,
            fontSize: currentFontSize,
            fontFamily: currentFontFamily,
            strokeWidth: currentStrokeWidth,
            opacity: 1,
            ...options
        };

        setElements(prev => [...prev, newElement]);
        setActiveElementId(newElement.id);
        setActiveTool('select');
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (activeTool === 'select' || activeTool === 'image') return;

        const rect = previewContainerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Check if clicking near an existing element
        const clickedElement = elements.find(el =>
            el.pageIndex === currentPage - 1 &&
            x >= el.x && x <= el.x + el.width &&
            y >= el.y && y <= el.y + el.height
        );

        // If clicking on an existing element, select it instead of creating a new one
        if (clickedElement) {
            setActiveElementId(clickedElement.id);
            setActiveTool('select');
            return;
        }

        const options: Partial<EditElement> = { x, y };
        if (activeTool === 'text') {
            options.content = 'New Text';
            options.textAlign = 'left';
        }
        if (activeTool === 'shape') options.shapeType = activeShapeType;

        addElement(activeTool, options);
    };

    const updateElement = (id: string, updates: Partial<EditElement>) => {
        setElements(prev => prev.map(el => {
            if (el.id === id) {
                const updated = { ...el, ...updates };
                // If it's an existing element and coordinates/size changed, mark as moved
                if (el.existing && (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined)) {
                    updated.moved = true;
                }
                if (el.existing && updates.content !== undefined && updates.content !== el.originalContent) {
                    updated.content_changed = true;
                }
                return updated;
            }
            return el;
        }));
    };

    const removeElement = (id: string) => {
        setElements(prev => {
            const el = prev.find(e => e.id === id);
            if (el?.existing) {
                return prev.map(e => e.id === id ? { ...e, redact: true } : e);
            }
            return prev.filter(e => e.id !== id);
        });

        if (activeElementId === id) setActiveElementId(null);
    };

    // Image Upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const imgFile = e.target.files?.[0];
        if (!imgFile) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            addElement('image', { content: event.target?.result as string });
        };
        reader.readAsDataURL(imgFile);
    };



    // Apply & Save via Python
    const handleApply = async () => {
        if (!file || elements.length === 0) return;

        setIsProcessing(true);
        try {
            const fileBytes = await file.arrayBuffer();
            const resultBytes: any = await magicPdfWorker.execute('apply_edits', {
                file_bytes: new Uint8Array(fileBytes),
                edits: elements.filter(el => !el.existing || el.moved || el.redact || el.content !== el.originalContent).map(el => ({
                    ...el,
                    // content is already dataUrl for images/drawings or text
                }))
            });

            if (resultBytes && resultBytes.error) {
                throw new Error(resultBytes.error);
            }

            // resultBytes is now a copied Uint8Array returned by the worker
            const blob = new Blob([resultBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setResultPdfUrl(url);

        } catch (error) {
            console.error('Error editing PDF:', error);
            alert('Failed to save edited PDF: ' + (error as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    const activeElement = elements.find(el => el.id === activeElementId);

    // Sync properties when element is selected
    useEffect(() => {
        if (activeElement) {
            if (activeElement.color) setCurrentColor(activeElement.color);
            if (activeElement.fontSize) setCurrentFontSize(activeElement.fontSize);
            if (activeElement.fontFamily) setCurrentFontFamily(activeElement.fontFamily);
        }
    }, [activeElementId]);

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 h-full flex flex-col">
            <AnimatePresence mode="wait">
                {!file ? (
                    <m.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <Card className="p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                                    <Edit3 className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">Edit PDF</h2>
                                <p className="text-text-muted">Add content or mask existing parts of your document.</p>
                            </div>
                            <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" multiple={false} className="max-w-2xl mx-auto" />
                        </Card>
                    </m.div>
                ) : (
                    <m.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-[80vh]">
                        {/* Notice Banner */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
                            <div className="bg-amber-100 p-1.5 rounded-full shrink-0">
                                <Info className="w-4 h-4 text-amber-600" />
                            </div>
                            <p className="text-[13px] font-medium text-amber-900 leading-snug">
                                <strong className="font-bold uppercase tracking-wide text-[11px] mr-1">Text Notice:</strong>
                                Editing currently supports <span className="underline decoration-amber-300">English (Latin)</span> characters only. We are building expanded global language and symbol capabilities right now!
                            </p>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                            {/* Toolbar */}
                            <div className="w-full lg:w-72 flex flex-col gap-4 shrink-0 overflow-y-auto pr-2 custom-scrollbar">
                                <Card className="p-3 flex flex-col gap-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <ToolButton active={activeTool === 'select'} onClick={() => setActiveTool('select')} icon={<MousePointer2 className="w-4 h-4" />} label="Select" />
                                        <ToolButton active={activeTool === 'text'} onClick={() => setActiveTool('text')} icon={<Type className="w-4 h-4" />} label="Text" />
                                        <ToolButton active={activeTool === 'whiteout'} onClick={() => setActiveTool('whiteout')} icon={<Eraser className="w-4 h-4" />} label="Mask" />
                                        <ToolButton active={activeTool === 'shape' && activeShapeType === 'rectangle'} onClick={() => { setActiveTool('shape'); setActiveShapeType('rectangle'); }} icon={<Square className="w-4 h-4" />} label="Rect" />
                                        <ToolButton active={activeTool === 'shape' && activeShapeType === 'circle'} onClick={() => { setActiveTool('shape'); setActiveShapeType('circle'); }} icon={<Circle className="w-4 h-4" />} label="Circle" />
                                        <div className="h-6 w-px bg-border-medium mx-2 hidden sm:block" />
                                        <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-elevated border border-border-medium rounded-md hover:bg-surface-secondary cursor-pointer shadow-sm">
                                            <Upload size={14} />
                                            <span className="hidden sm:inline">Add Image</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                </Card>

                                {/* Property Editor */}
                                {(activeElement || activeTool !== 'select') && (
                                    <Card className="p-4 space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-faint">Properties</h4>
                                        <div className="space-y-3">
                                            {activeElement?.type !== 'whiteout' && (
                                                <div>
                                                    <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Color</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#FFFFFF'].map(color => (
                                                            <button
                                                                key={color}
                                                                className={cn("w-6 h-6 rounded-full border transition-all", (activeElement?.color === color || currentColor === color) && "ring-2 ring-primary ring-offset-2 scale-110")}
                                                                style={{ backgroundColor: color }}
                                                                onClick={() => activeElement ? updateElement(activeElement.id, { color }) : setCurrentColor(color)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {activeElement?.type === 'text' && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Font Size</label>
                                                        <div className="flex items-center gap-2">
                                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateElement(activeElement.id, { fontSize: Math.max(8, (activeElement.fontSize || 12) - 2) })}><Minus className="w-3 h-3" /></Button>
                                                            <span className="text-sm font-medium w-8 text-center">{Math.round(activeElement.fontSize || 12)}</span>
                                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateElement(activeElement.id, { fontSize: (activeElement.fontSize || 12) + 2 })}><Plus className="w-3 h-3" /></Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Alignment</label>
                                                        <div className="flex bg-surface-secondary rounded-lg p-1 w-fit">
                                                            {(['left', 'center', 'right'] as const).map(align => (
                                                                <button
                                                                    key={align}
                                                                    className={cn("px-2 py-1 rounded-md text-[10px] uppercase font-bold transition-all", (activeElement.textAlign === align) ? "bg-surface-elevated text-primary shadow-sm" : "text-text-faint hover:text-text-muted")}
                                                                    onClick={() => updateElement(activeElement.id, { textAlign: align })}
                                                                >
                                                                    {align}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Font Family</label>
                                                        <select
                                                            className="w-full h-8 text-xs bg-surface-secondary rounded-md px-2 outline-none border-none"
                                                            value={activeElement.fontFamily || 'Inter'}
                                                            onChange={(e) => updateElement(activeElement.id, { fontFamily: e.target.value })}
                                                        >
                                                            <option value="Inter">Inter (Sans)</option>
                                                            <option value="Times">Times (Serif)</option>
                                                            <option value="Courier">Courier (Mono)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            {activeElement?.type === 'image' && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Rotation</label>
                                                        <div className="flex items-center gap-2">
                                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateElement(activeElement.id, { rotation: ((activeElement.rotation || 0) - 90 + 360) % 360 })}>
                                                                <RotateCcw className="w-3 h-3" />
                                                            </Button>
                                                            <span className="text-sm font-medium w-12 text-center">{activeElement.rotation || 0}°</span>
                                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateElement(activeElement.id, { rotation: ((activeElement.rotation || 0) + 90) % 360 })}>
                                                                <RotateCw className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Quick Rotate</label>
                                                        <div className="flex gap-1">
                                                            {[0, 90, 180, 270].map(deg => (
                                                                <button
                                                                    key={deg}
                                                                    className={cn("px-2 py-1 rounded text-[10px] font-bold transition-all", (activeElement.rotation || 0) === deg ? "bg-primary text-background" : "bg-surface-secondary hover:bg-border-medium")}
                                                                    onClick={() => updateElement(activeElement.id, { rotation: deg })}
                                                                >
                                                                    {deg}°
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {activeElement && <Button variant="ghost" size="sm" className="w-full text-red-500 hover:bg-red-50" onClick={() => removeElement(activeElement.id)}><Trash2 className="w-3 h-3 mr-2" /> Delete</Button>}
                                    </Card>
                                )}

                                <div className="mt-auto space-y-3">
                                    <Button className="w-full h-12 shadow-lg" onClick={handleApply} isLoading={isProcessing} disabled={elements.length === 0}>Save PDF Changes</Button>
                                    <Button variant="ghost" className="w-full text-text-faint" onClick={() => setFile(null)}>Cancel</Button>
                                </div>
                            </div>

                            {/* Viewport */}
                            <div className="flex-1 bg-surface-secondary rounded-2xl flex flex-col overflow-hidden border border-border-medium shadow-inner relative">
                                <div className="h-14 bg-surface-elevated border-b flex items-center justify-between px-6 z-10 shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="flex bg-surface-secondary rounded-lg p-1">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}><ChevronLeft className="w-4 h-4" /></Button>
                                            <div className="px-3 text-xs font-bold text-text-muted min-w-[60px] flex items-center justify-center">{currentPage} / {totalPages || '?'}</div>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}><ChevronRight className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-1">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
                                            <span className="text-[10px] font-bold text-text-muted w-10 text-center">{Math.round(scale * 100)}%</span>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setScale(s => Math.min(2, s + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto p-12 flex justify-center items-start custom-scrollbar">
                                    <div ref={previewContainerRef} className={cn("relative shadow-2xl transition-all duration-300", activeTool !== 'select' && "cursor-crosshair")} style={{ width: canvasSize.width || 'fit-content', height: canvasSize.height || 'auto' }} onClick={handleCanvasClick}>
                                        <PdfPreview file={file} pageNumber={currentPage} scale={scale} onLoadSuccess={setTotalPages} onResize={handleCanvasResize} className="rounded-lg overflow-hidden" />
                                        <div className="absolute top-0 left-0 pointer-events-none z-30" style={{ width: canvasSize.width, height: canvasSize.height }}>
                                            {elements.filter(el => el.pageIndex === currentPage - 1).map(el => (
                                                <EditableElement key={el.id} el={el} scale={scale} active={activeElementId === el.id} onSelect={() => setActiveElementId(el.id)} onUpdate={(updates) => updateElement(el.id, updates)} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {resultPdfUrl && (
                                    <div className="absolute inset-0 bg-surface-elevated/95 backdrop-blur-md z-40 flex items-center justify-center p-8">
                                        <m.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center space-y-6">
                                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                                            <h3 className="text-2xl font-bold">PDF Updated!</h3>
                                            <p className="text-text-muted">Your edits have been applied successfully.</p>
                                            <div className="flex gap-3">
                                                <a href={resultPdfUrl} download={`edited_${file.name}`} className="flex-1"><Button className="w-full">Download</Button></a>
                                                <Button variant="ghost" onClick={() => setResultPdfUrl(null)}>Close</Button>
                                            </div>
                                        </m.div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const ToolButton = ({ active, onClick, icon, label }: { active?: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center p-2 rounded-lg transition-all", active ? "bg-primary text-background" : "hover:bg-surface-secondary text-text-muted")}>
        {icon}
        <span className="text-[10px] font-bold uppercase mt-1">{label}</span>
    </button>
);

const EditableElement = ({ el, active, onSelect, onUpdate, scale = 1 }: { el: EditElement, active: boolean, onSelect: () => void, onUpdate: (updates: Partial<EditElement>) => void, scale?: number }) => {
    const elRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isEditingText, setIsEditingText] = useState(el.type === 'text' && el.content === 'New Text');
    const [resizeDir, setResizeDir] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const isModified = el.existing && (el.content !== el.originalContent || el.moved);
    // Always show background for whiteout, modified elements, or when actively editing.
    // Also show for new text elements.
    const showBackground = el.type === 'whiteout' || isModified || isEditingText || (!el.existing && el.type === 'text');

    if (el.redact) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isEditingText) return;
        e.stopPropagation();
        onSelect();

        // Calculate the offset from where we clicked within the element
        if (elRef.current?.parentElement) {
            const rect = elRef.current.parentElement.getBoundingClientRect();
            const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100;
            setDragOffset({
                x: clickXPercent - el.x,
                y: clickYPercent - el.y
            });
        }
        setIsDragging(true);
    };

    const handleResizeStart = (e: React.MouseEvent, dir: string) => {
        e.stopPropagation();
        onSelect();
        setResizeDir(dir);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!elRef.current?.parentElement) return;
        const rect = elRef.current.parentElement.getBoundingClientRect();

        if (isDragging) {
            const newX = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
            const newY = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;
            // Clamp values to keep element within bounds
            onUpdate({
                x: Math.max(0, Math.min(100 - el.width, newX)),
                y: Math.max(0, Math.min(100 - el.height, newY))
            });
        } else if (resizeDir) {
            const mX = ((e.clientX - rect.left) / rect.width) * 100;
            const mY = ((e.clientY - rect.top) / rect.height) * 100;
            const updates: Partial<EditElement> = {};
            if (resizeDir.includes('e')) updates.width = Math.max(2, Math.abs(mX - el.x) * 2);
            if (resizeDir.includes('w')) updates.width = Math.max(2, Math.abs(el.x - mX) * 2);
            if (resizeDir.includes('s')) updates.height = Math.max(1, Math.abs(mY - el.y) * 2);
            if (resizeDir.includes('n')) updates.height = Math.max(1, Math.abs(el.y - mY) * 2);
            onUpdate(updates);
        }
    }, [isDragging, resizeDir, el.x, el.y, el.width, el.height, dragOffset, onUpdate]);

    useEffect(() => {
        if (isDragging || resizeDir) {
            window.addEventListener('mousemove', handleMouseMove);
            const stop = () => { setIsDragging(false); setResizeDir(null); };
            window.addEventListener('mouseup', stop);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', stop);
            };
        }
    }, [isDragging, resizeDir, handleMouseMove]);

    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

    return (
        <div
            ref={elRef}
            className={cn(
                "absolute pointer-events-auto transition-all duration-200",
                active ? "z-30 ring-1 ring-primary bg-primary/5" : "z-20 border border-transparent hover:border-blue-300/30",
                el.existing && !isModified && !active && "cursor-text"
            )}
            style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%` }}
            onMouseDown={handleMouseDown}
            onDoubleClick={() => el.type === 'text' && setIsEditingText(true)}
        >
            <div className={cn("w-full h-full flex items-center relative", showBackground && "bg-surface-elevated")}>
                {el.type === 'text' && (
                    isEditingText ?
                        <textarea autoFocus className="text-left outline-none bg-transparent resize-none w-full h-full p-0 m-0 leading-tight overflow-hidden" style={{ color: el.color || '#000000', fontSize: `${(el.fontSize || 16) * scale}px`, fontFamily: el.fontFamily, textAlign: el.textAlign || 'left' }} value={el.content} onChange={e => { onUpdate({ content: e.target.value }); }} onBlur={() => setIsEditingText(false)} /> :
                        ((!el.existing || isModified) && <p style={{ color: el.color || '#000000', fontSize: `${(el.fontSize || 16) * scale}px`, fontFamily: el.fontFamily, textAlign: el.textAlign || 'left' }} className="text-left wrap-break-word m-0 p-0 w-full leading-tight">{el.content}</p>)
                )}
                {el.type === 'image' && (
                    <div className="w-full h-full flex items-center justify-center" style={{ transform: `rotate(${el.rotation || 0}deg)` }}>
                        <img src={el.content} className="max-w-full max-h-full object-contain pointer-events-none" alt="Uploaded image" />
                    </div>
                )}
                {el.type === 'drawing' && <img src={el.content} className="w-full h-full object-contain pointer-events-none" />}
                {el.type === 'shape' && (
                    <div style={{ width: '100%', height: '100%', border: `${(el.strokeWidth || 2) * scale}px solid ${el.color}`, borderRadius: el.shapeType === 'circle' ? '50%' : '0' }} />
                )}
            </div>
            {active && handles.map(h => (
                <div key={h} className={cn("absolute w-2.5 h-2.5 bg-surface-elevated border border-primary z-40 rounded-full", h === 'nw' && "-top-1 -left-1", h === 'n' && "-top-1 left-1/2 -translate-x-1/2", h === 'ne' && "-top-1 -right-1", h === 'e' && "top-1/2 -right-1 -translate-y-1/2", h === 'se' && "-bottom-1 -right-1", h === 's' && "-bottom-1 left-1/2 -translate-x-1/2", h === 'sw' && "-bottom-1 -left-1", h === 'w' && "top-1/2 -left-1 -translate-y-1/2")} onMouseDown={e => handleResizeStart(e, h)} />
            ))}
        </div>
    );
};
