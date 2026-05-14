
import React, { useRef, useState } from "react";
import { m } from "framer-motion";
import { cn, formatBytes } from "@/lib/utils";
import { ImageIcon, MoveHorizontal, ZoomIn, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ImagePreviewProps {
    originalUrl: string | null;
    compressedUrl: string | null;
    originalInfo: any;
    compressedInfo: any;
    isProcessing: boolean;
    mode?: 'compress' | 'upscale' | 'resize';
}

export function ImagePreview({
    originalUrl,
    compressedUrl,
    originalInfo,
    compressedInfo,
    isProcessing,
    mode = 'compress'
}: ImagePreviewProps) {
    const [sliderValue, setSliderValue] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    if (!originalUrl) return null;

    // Calculate percentage change
    const sizeDiff = compressedInfo && originalInfo
        ? ((compressedInfo.size_bytes - originalInfo.size_bytes) / originalInfo.size_bytes) * 100
        : 0;

    const isSmaller = sizeDiff < 0;
    const diffLabel = isSmaller ? `${sizeDiff.toFixed(1)}%` : `+${sizeDiff.toFixed(1)}%`;
    const diffColor = isSmaller ? "text-emerald-700 bg-emerald-100" : "text-amber-700 bg-amber-100";

    const labelText = mode === 'upscale' ? 'Upscaled' : mode === 'resize' ? 'Resized' : 'Compressed';
    const labelColorClass = mode === 'upscale' ? "text-violet-600" : mode === 'resize' ? "text-cyan-600" : "text-emerald-600";
    const badgeColorClass = mode === 'upscale' ? "bg-violet-600/80 shadow-violet-900/20" : mode === 'resize' ? "bg-cyan-600/80 shadow-cyan-900/20" : "bg-emerald-600/80 shadow-emerald-900/20";

    return (
        <div className="relative w-full h-full flex flex-col gap-4">
            {/* Stats Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-overlay)] backdrop-blur-md rounded-2xl border border-[var(--border-subtle)] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Original</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-text-primary">{formatBytes(originalInfo?.size_bytes || 0)}</span>
                            {originalInfo?.width && (
                                <span className="text-[10px] text-text-muted font-mono">
                                    {originalInfo.width}x{originalInfo.height}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {compressedUrl && (
                    <>
                        <div className="h-8 w-px bg-[var(--border-medium)]" />

                        <div className="flex flex-col items-end">
                            <span className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1", labelColorClass)}>
                                {labelText}
                                <span className={cn("px-1.5 rounded text-[10px]", diffColor)}>{diffLabel}</span>
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-text-primary">{formatBytes(compressedInfo?.size_bytes || 0)}</span>
                                {compressedInfo?.width && (
                                    <span className="text-[10px] text-text-muted font-mono">
                                        {compressedInfo.width}x{compressedInfo.height}
                                    </span>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Comparison Slider */}
            <div
                ref={containerRef}
                className="relative flex-1 min-h-[400px] w-full bg-checkered rounded-3xl overflow-hidden border border-[var(--border-medium)] shadow-inner group select-none"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {/* Background Image (Processed/After) */}
                {compressedUrl ? (
                    <img
                        src={compressedUrl}
                        alt={labelText}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-sm text-text-muted animate-pulse">
                            Waiting for {mode === 'upscale' ? 'upscaling' : mode === 'resize' ? 'resizing' : 'compression'}...
                        </span>
                    </div>
                )}

                {/* Foreground Image (Original/Before) - Clipped */}
                <div
                    className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none border-r-2 border-white/50 shadow-2xl"
                    style={{
                        clipPath: compressedUrl ? `inset(0 ${100 - sliderValue}% 0 0)` : 'none'
                    }}
                >
                    <img
                        src={originalUrl}
                        alt="Original"
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ width: '100%', height: '100%' }} // Ensure it matches parent exactly
                    />

                    {/* Floating Label: Original */}
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg pointer-events-auto">
                        Original
                    </div>
                </div>

                {/* Floating Label: Processed */}
                {compressedUrl && (
                    <div className={cn("absolute bottom-4 right-4 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg pointer-events-auto shadow-lg", badgeColorClass)}>
                        {labelText}
                    </div>
                )}


                {/* Slider Handle */}
                {compressedUrl && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(0,0,0,0.3)] cursor-ew-resize pointer-events-auto flex items-center justify-center group-hover:bg-blue-400 transition-colors"
                            style={{ left: `${sliderValue}%` }}
                        >
                            <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform">
                                <MoveHorizontal className="w-4 h-4 text-gray-600" />
                            </div>
                        </div>
                        {/* Interactive Range Input (Invisible overlay) */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderValue}
                            onChange={(e) => setSliderValue(Number(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 pointer-events-auto"
                        />
                    </div>
                )}
            </div>

            <style jsx global>{`
                .bg-checkered {
                    background-image: linear-gradient(45deg, var(--border-subtle) 25%, transparent 25%), linear-gradient(-45deg, var(--border-subtle) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--border-subtle) 75%), linear-gradient(-45deg, transparent 75%, var(--border-subtle) 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }
            `}</style>
        </div>
    );
}
