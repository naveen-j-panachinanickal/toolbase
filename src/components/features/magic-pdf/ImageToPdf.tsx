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
    FilePlus,
    Trash2,
    GripVertical
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTIPTool } from '@/hooks/useTIPTool';
import { cn } from '@/lib/utils';
import { PdfPreview } from '@/components/ui/PdfPreview';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableImage({ file, id, onRemove }: { file: File, id: string, onRemove: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group aspect-square bg-surface-elevated rounded-lg border border-border-medium overflow-hidden shadow-sm touch-none"
        >
            <div
                {...attributes}
                {...listeners}
                className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
            />

            <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-full h-full object-cover pointer-events-none"
            />

            <div className="absolute top-2 right-2 p-1 bg-black/50 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                <GripVertical className="w-4 h-4" />
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                <div className="text-white text-[10px] truncate max-w-[80px]">
                    {file.name}
                </div>
                <button
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="p-1.5 bg-surface-elevated rounded-full text-red-600 hover:bg-red-50 shadow-lg transform scale-90 hover:scale-100 transition-all cursor-pointer"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

        </div>
    );
}

export default function ImageToPdf() {
    const [files, setFiles] = useState<File[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
    const { execute, isProcessing } = useTIPTool('magic-pdf/images-to-pdf');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleFilesSelected = (newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles]);
        setResultPdfUrl(null);
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex(f => (f.name + f.size) === active.id);
                const newIndex = items.findIndex(f => (f.name + f.size) === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const handleConvert = async () => {
        if (files.length === 0) return;

        try {
            const outputFiles = await execute(files, {});
            if (outputFiles && outputFiles.length > 0) {
                const url = URL.createObjectURL(outputFiles[0]);
                setResultPdfUrl(url);
            }
        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Failed to convert images to PDF');
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
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                                    <ImageIcon className="w-8 h-8 text-pink-600" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">Images to PDF</h2>
                                <p className="text-text-muted">Combine multiple images into a single PDF document. Drag to reorder.</p>
                            </div>

                            <div className="space-y-6">
                                {files.length === 0 ? (
                                    <FileUploader
                                        onFilesSelected={handleFilesSelected}
                                        accept="image/*"
                                        multiple={true}
                                    />
                                ) : (
                                    <div className="bg-surface-secondary rounded-xl p-6 border border-border-subtle space-y-6">
                                        <div className="flex items-center justify-between text-sm text-text-muted">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-text-secondary">{files.length} images selected</span>
                                                <span className="text-xs text-text-faint">Drag images to reorder page sequence</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="relative overflow-hidden">
                                                    <Button variant="outline" size="sm" className="relative z-10">
                                                        <FilePlus className="w-4 h-4 mr-2" />
                                                        Add More
                                                    </Button>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                                        onChange={(e) => {
                                                            if (e.target.files) {
                                                                handleFilesSelected(Array.from(e.target.files));
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                    Clear All
                                                </Button>
                                            </div>
                                        </div>

                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={files.map(f => f.name + f.size)}
                                                strategy={rectSortingStrategy}
                                            >
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                    {files.map((file) => (
                                                        <SortableImage
                                                            key={file.name + file.size}
                                                            id={file.name + file.size}
                                                            file={file}
                                                            onRemove={() => setFiles(prev => prev.filter(f => f !== file))}
                                                        />
                                                    ))}
                                                </div>
                                            </SortableContext>

                                            <DragOverlay>
                                                {activeId ? (
                                                    <div className="w-32 h-32 bg-surface-elevated rounded-lg border border-pink-500 shadow-xl overflow-hidden opacity-90 cursor-grabbing">
                                                        <img
                                                            src={URL.createObjectURL(files.find(f => (f.name + f.size) === activeId) || files[0])}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : null}
                                            </DragOverlay>
                                        </DndContext>
                                    </div>
                                )}

                                <Button
                                    className="w-full h-12 text-lg shadow-lg hover:shadow-xl transition-all bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleConvert}
                                    isLoading={isProcessing}
                                    disabled={files.length === 0}
                                >
                                    <ArrowRightLeft className="w-5 h-5 mr-2" />
                                    Convert to PDF
                                </Button>
                            </div>
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
                                <p className="text-text-muted text-lg">Your images have been combined into a PDF.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                                <a
                                    href={resultPdfUrl}
                                    download="images-combined.pdf"
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
                                        setFiles([]);
                                        setResultPdfUrl(null);
                                    }}
                                >
                                    Convert More
                                </Button>
                            </div>
                        </Card>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
