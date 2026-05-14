import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, FileUp } from 'lucide-react';

interface FileDropZoneProps {
    onFileSelected: (file: File | null) => void;
    accept?: string;
    className?: string;
    disabled?: boolean;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
    onFileSelected,
    accept = '*',
    className,
    disabled = false,
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragOver(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            if (disabled) return;

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                onFileSelected(files[0]);
            }
        },
        [disabled, onFileSelected]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                onFileSelected(e.target.files[0]);
            }
        },
        [onFileSelected]
    );

    const handleClick = () => {
        if (!disabled) {
            inputRef.current?.click();
        }
    };

    return (
        <div
            className={cn(
                'relative overflow-hidden transition-all duration-500 cursor-pointer',
                'border-2 border-dashed rounded-3xl backdrop-blur-md',
                'bg-gradient-to-br from-white/90 via-gray-50/50 to-white/90',
                isDragOver
                    ? 'border-purple-500/60 bg-purple-50/30 scale-[1.02] shadow-2xl shadow-purple-500/20'
                    : 'border-gray-300/60 hover:border-purple-400/50 hover:bg-white/70 hover:shadow-xl hover:shadow-gray-200/50',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            {/* Animated gradient border effect */}
            <div className={cn(
                "absolute inset-0 transition-opacity duration-500",
                isDragOver ? "opacity-100" : "opacity-0"
            )}>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-500/10 animate-gradient" />
            </div>

            {/* Floating particles animation on drag over */}
            {isDragOver && (
                <>
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400/40 rounded-full animate-ping" />
                    <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-violet-400/30 rounded-full animate-ping delay-100" />
                    <div className="absolute bottom-1/4 left-2/3 w-2 h-2 bg-fuchsia-400/40 rounded-full animate-ping delay-200" />
                </>
            )}

            <div className="relative flex flex-col items-center justify-center py-14 px-6 text-center">
                {/* Icon with animated container */}
                <div
                    className={cn(
                        "relative mb-6 rounded-3xl p-5 transition-all duration-500 ease-out",
                        "bg-gradient-to-br from-white to-gray-50/80",
                        "shadow-lg backdrop-blur-sm",
                        isDragOver
                            ? "scale-110 rotate-3 shadow-2xl shadow-purple-500/25 ring-4 ring-purple-200/50"
                            : "shadow-md group-hover:shadow-xl"
                    )}
                >
                    <div
                        className={cn(
                            "rounded-2xl p-4 transition-all duration-500",
                            isDragOver
                                ? "bg-gradient-to-br from-purple-500/20 via-violet-500/10 to-purple-500/20"
                                : "bg-gradient-to-br from-gray-100 to-gray-50"
                        )}
                    >
                        <div className="relative">
                            <Upload
                                className={cn(
                                    "h-8 w-8 transition-all duration-500",
                                    isDragOver
                                        ? "text-purple-600 scale-125 animate-bounce"
                                        : "text-gray-600 group-hover:text-gray-800"
                                )}
                            />
                            {isDragOver && (
                                <FileUp
                                    className="h-4 w-4 text-purple-400 absolute -top-1 -right-1 animate-pulse"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Text content */}
                <div className="relative space-y-2.5">
                    <h4
                        className={cn(
                            "text-xl font-bold transition-all duration-300",
                            "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent",
                            isDragOver && "from-purple-600 via-violet-600 to-purple-600"
                        )}
                    >
                        {isDragOver ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-pulse">Drop your file</span>
                                <span className="text-purple-500">here</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Drag & drop your file
                                <span className="text-gray-400 font-normal">or</span>
                            </span>
                        )}
                    </h4>
                    <p className={cn(
                        "text-sm transition-all duration-300",
                        isDragOver ? "text-purple-600 font-medium" : "text-gray-500"
                    )}>
                        {isDragOver ? "Release to upload" : "click to browse"}
                    </p>
                    {accept !== '*' && (
                        <div className="flex items-center justify-center gap-1.5 mt-3">
                            <div className="h-px w-8 bg-gray-200" />
                            <p className="text-xs text-gray-400 bg-gray-100/80 px-3 py-1.5 rounded-full">
                                {accept}
                            </p>
                            <div className="h-px w-8 bg-gray-200" />
                        </div>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={accept}
                    onChange={handleFileInput}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};
