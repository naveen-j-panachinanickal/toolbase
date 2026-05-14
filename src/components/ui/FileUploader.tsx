import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, File, Image, Music, FileText, Film, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in bytes
    className?: string;
    showFileList?: boolean;
    disabled?: boolean;
}

export const FileUploader = ({
    onFilesSelected,
    accept = '*',
    multiple = true,
    maxSize,
    className,
    showFileList = true,
    disabled = false,
}: FileUploaderProps) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const files = Array.from(e.dataTransfer.files);
            validateAndPassFiles(files);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                const files = Array.from(e.target.files);
                validateAndPassFiles(files);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const validateAndPassFiles = (files: File[]) => {
        // Filter accept
        const acceptedFiles = files.filter((file) => {
            if (accept === '*') return true;
            const acceptTypes = accept.split(',').map(t => t.trim());
            return acceptTypes.some(type => {
                if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase());
                return file.type.match(new RegExp(type.replace('*', '.*')));
            });
        });

        // Simulate upload progress for demo
        acceptedFiles.forEach((file, index) => {
            const fileName = file.name;
            // Simulate progressive upload
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10 + Math.random() * 20;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                setUploadProgress(prev => ({ ...prev, [fileName]: progress }));
            }, 100);
        });

        setUploadedFiles(prev => [...prev, ...acceptedFiles]);
        onFilesSelected(acceptedFiles);
        // Reset input
        if (inputRef.current) inputRef.current.value = '';
    };

    const removeFile = (fileName: string) => {
        setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
        setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileName];
            return newProgress;
        });
    };

    const clearAllFiles = () => {
        setUploadedFiles([]);
        setUploadProgress({});
    };

    const getFileIcon = (file: File) => {
        const type = file.type.split('/')[0];
        switch (type) {
            case 'image':
                return <Image className="h-4 w-4" />;
            case 'audio':
                return <Music className="h-4 w-4" />;
            case 'video':
                return <Film className="h-4 w-4" />;
            case 'text':
            case 'application':
                if (file.type.includes('pdf') || file.type.includes('document')) {
                    return <FileText className="h-4 w-4" />;
                }
                return <File className="h-4 w-4" />;
            default:
                return <File className="h-4 w-4" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={cn('space-y-5', className)}>
            <div
                className={cn(
                    'relative overflow-hidden transition-all duration-300 cursor-pointer',
                    'border-2 border-dashed rounded-2xl backdrop-blur-sm',
                    'bg-surface',
                    isDragOver
                        ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10'
                        : 'border-border-medium hover:border-primary/50 hover:bg-surface/80 hover:shadow-xl',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
            >
                {/* Animated background effect on drag */}
                {isDragOver && (
                    <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
                )}

                <div className="relative flex flex-col items-center justify-center py-12 px-6 text-center">
                    {/* Icon container */}
                    <div className={cn(
                        "relative mb-5 rounded-2xl p-4 transition-all duration-300",
                        "bg-surface-elevated shadow-md",
                        isDragOver
                            ? "scale-110 shadow-xl shadow-primary/20 ring-2 ring-primary/20"
                            : "shadow-md"
                    )}>
                        <div className={cn(
                            "rounded-xl p-3 transition-colors duration-300",
                            isDragOver
                                ? "bg-primary/10"
                                : "bg-surface-secondary"
                        )}>
                            <Upload className={cn(
                                "h-8 w-8 transition-all duration-300",
                                isDragOver
                                    ? "text-primary scale-110"
                                    : "text-text-secondary"
                            )} />
                        </div>
                    </div>

                    {/* Main text */}
                    <div className="relative space-y-2 mb-6 max-w-sm">
                        <h3 className={cn(
                            "text-xl font-bold transition-all duration-300",
                            "text-text-primary",
                            isDragOver && "text-primary"
                        )}>
                            {isDragOver ? 'Drop files to upload' : 'Drag & drop files here'}
                        </h3>
                        <p className={cn(
                            "text-sm transition-all duration-300",
                            isDragOver ? "text-primary font-medium" : "text-text-muted"
                        )}>
                            Upload {multiple ? 'files' : 'a file'} to get started.
                            {accept !== '*' && accept !== '*' && (
                                <span className="block mt-1 text-xs text-text-faint">
                                    Supports: {accept}
                                </span>
                            )}
                        </p>

                        {/* Max size badge */}
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <div className="h-px w-8 bg-gray-200" />
                            <div className={cn(
                                "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full",
                                isDragOver
                                    ? "bg-primary/10 text-primary"
                                    : "bg-surface-secondary text-text-muted"
                            )}>
                                <AlertCircle className="h-3.5 w-3.5" />
                                Max: {maxSize ? formatFileSize(maxSize) : 'Unlimited'}
                            </div>
                            <div className="h-px w-8 bg-gray-200" />
                        </div>
                    </div>

                    {/* Browse button */}
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            inputRef.current?.click();
                        }}
                        className="relative overflow-hidden group"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Browse Files
                        </span>
                    </Button>

                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        multiple={multiple}
                        accept={accept}
                        onChange={handleFileInput}
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* File list with progress indicators */}
            {showFileList && uploadedFiles.length > 0 && (
                <Card className="overflow-hidden rounded-2xl border border-border-medium bg-surface-elevated shadow-lg">
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-text-primary">Uploaded Files</h4>
                                    <p className="text-xs text-text-muted">
                                        {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={clearAllFiles}
                                variant="ghost"
                                size="sm"
                                className="text-text-muted hover:text-red-600 hover:bg-red-50"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear all
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                            {uploadedFiles.map((file) => {
                                const progress = uploadProgress[file.name] || 0;
                                const isComplete = progress === 100;

                                return (
                                    <div
                                        key={file.name}
                                        className="group flex items-center gap-3 p-3 rounded-xl border border-border-medium hover:border-primary/20 hover:bg-primary/5 transition-all duration-200"
                                    >
                                        <div className="shrink-0">
                                            <div className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                isComplete
                                                    ? "bg-green-500/10 text-green-600"
                                                    : "bg-surface-secondary text-text-secondary"
                                            )}>
                                                {getFileIcon(file)}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-text-primary truncate text-sm">
                                                    {file.name}
                                                </p>
                                                <button
                                                    onClick={() => removeFile(file.name)}
                                                    className="opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-100 rounded text-text-faint hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className={cn(
                                                        "font-medium",
                                                        isComplete ? "text-green-600" : "text-primary"
                                                    )}>
                                                        {isComplete ? 'Ready' : `${progress.toFixed(0)}%`}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all duration-300 rounded-full",
                                                            isComplete
                                                                ? "bg-green-500"
                                                                : "bg-primary"
                                                        )}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
