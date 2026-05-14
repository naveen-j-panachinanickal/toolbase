import React, { useState, useEffect, useMemo } from "react";
import { FileUploader } from "@/components/ui/FileUploader";
import { Button } from "@/components/ui/Button";
import { Download, RefreshCw, Zap, Scaling } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { formatBytes, cn } from "@/lib/utils";
import { ImagePreview } from "@/components/features/pixels/ImagePreview";
import { CompressionSettings } from "@/components/features/pixels/CompressionSettings";

import { useTIPTool } from "@/hooks/useTIPTool";
import { getImageInfo } from "@/lib/image-utils";


export function UpscaleImage() {
    // State
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [originalInfo, setOriginalInfo] = useState<any>(null);

    const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
    const [compressedInfo, setCompressedInfo] = useState<any>(null);

    // Engine Hook — config defaults come directly from the TIP schema.
    // This keeps the direct tool and the pipeline node in sync automatically.
    const { execute, isProcessing, error, tool } = useTIPTool('pixels/upscale');
    const isReady = true;

    const defaultConfig = useMemo(
        () => Object.fromEntries(
            (tool?.configSchema.fields ?? []).map(f => [f.key, f.default])
        ),
        [tool]
    );

    const [config, setConfig] = useState<Record<string, any>>(defaultConfig);

    /** Update a single config field by key */
    const updateConfig = (key: string, value: any) =>
        setConfig(prev => ({ ...prev, [key]: value }));

    // Seed config from schema defaults on first mount
    const seededRef = React.useRef(false);
    useEffect(() => {
        if (!seededRef.current && Object.keys(defaultConfig).length > 0) {
            setConfig(defaultConfig);
            seededRef.current = true;
        }
    }, [defaultConfig]);


    // Cleanup URLs
    useEffect(() => {
        return () => {
            if (originalUrl) URL.revokeObjectURL(originalUrl);
            if (compressedUrl) URL.revokeObjectURL(compressedUrl);
        };
    }, [originalUrl, compressedUrl]);

    const handleFileSelect = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];

        // Reset previous state
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        if (compressedUrl) URL.revokeObjectURL(compressedUrl);
        setCompressedUrl(null);
        setCompressedInfo(null);

        setOriginalFile(file);
        setOriginalUrl(URL.createObjectURL(file));

        try {
            const info = await getImageInfo(file);
            setOriginalInfo(info);

            // Auto-set format to match original if valid
            const detectedFormat = info.format && ["JPEG", "PNG", "WEBP"].includes(info.format)
                ? info.format
                : 'PNG';  // PNG is preferred for upscaling to avoid double lossy compression
            setConfig(prev => ({ ...prev, format: detectedFormat }));

        } catch (err) {
            console.error("Failed to get image info", err);
        }
    };

    const handleCompress = async () => {
        if (!originalFile) return;

        try {
            const outputFiles = await execute([originalFile], config);

            if (outputFiles && outputFiles.length > 0) {
                const blob = outputFiles[0];
                const url = URL.createObjectURL(blob);

                if (compressedUrl) URL.revokeObjectURL(compressedUrl);
                setCompressedUrl(url);

                const resizeFactor = Number(config.resizeFactor ?? 2.0);
                setCompressedInfo({
                    size_bytes: blob.size,
                    width: originalInfo?.width ? Math.round(originalInfo.width * resizeFactor) : 0,
                    height: originalInfo?.height ? Math.round(originalInfo.height * resizeFactor) : 0,
                });
            }

        } catch (err) {
            console.error("Compression failed", err);
        }
    };

    const downloadImage = () => {
        if (!compressedUrl) return;
        const link = document.createElement('a');
        link.href = compressedUrl;
        const ext = String(config.format ?? 'png').toLowerCase();
        link.download = `upscaled-image.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence mode="wait">
            {!originalFile ? (
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-2xl mx-auto mt-20"
                >
                    <div className="text-center mb-10 space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                            Upscale Images <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-600 to-fuchsia-600">With Enhancement</span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
                            Increase resolution up to 4x while maintaining sharpness.
                            Client-side processing only.
                        </p>
                    </div>

                    <div className="relative w-full">
                        {!isReady && (
                            <div className="absolute inset-0 z-10 bg-[var(--surface-overlay)] backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                                <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
                                <p className="text-text-muted font-medium">Initializing Engine...</p>
                            </div>
                        )}
                        <FileUploader
                            onFilesSelected={handleFileSelect}
                            accept="image/png, image/jpeg, image/webp"
                            multiple={false}
                            className={cn(
                                "min-h-[300px]",
                                !isReady && "cursor-wait opacity-50"
                            )}
                            disabled={!isReady || isProcessing}
                        />
                    </div>
                </m.div>
            ) : (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full"
                >
                    {/* Left Panel: Preview */}
                    <div className="lg:col-span-8 flex flex-col h-full gap-4">
                        <div className="flex-1 bg-[var(--surface-elevated)] rounded-[32px] shadow-xl shadow-black/5 dark:shadow-black/20 border border-[var(--border-subtle)] p-2">
                            <div className="w-full h-full rounded-[24px] overflow-hidden bg-[var(--surface-overlay)] relative">
                                <ImagePreview
                                    originalUrl={originalUrl}
                                    compressedUrl={compressedUrl}
                                    originalInfo={originalInfo}
                                    compressedInfo={compressedInfo}
                                    isProcessing={isProcessing}
                                    mode="upscale"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Settings Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-[var(--surface-elevated)] rounded-[32px] p-6 shadow-xl shadow-black/5 dark:shadow-black/20 border border-[var(--border-subtle)] flex-1">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-primary/10 rounded-xl">
                                    <Scaling className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-primary">Upscaling</h3>
                                    <p className="text-xs text-text-muted">Enhance resolution</p>
                                </div>
                            </div>

                            <CompressionSettings
                                mode="upscale"
                                quality={Number(config.quality ?? 90)}
                                setQuality={v => updateConfig('quality', v)}
                                format={String(config.format ?? 'PNG')}
                                setFormat={v => updateConfig('format', v)}
                                resizeFactor={Number(config.resizeFactor ?? 2.0)}
                                setResizeFactor={v => updateConfig('resizeFactor', v)}
                                enhance={true}
                                setEnhance={() => { }}
                                denoise={Boolean(config.denoise ?? false)}
                                setDenoise={v => updateConfig('denoise', v)}
                                vibrant={Boolean(config.vibrant ?? false)}
                                setVibrant={v => updateConfig('vibrant', v)}
                                printDpi={Boolean(config.printDpi ?? false)}
                                setPrintDpi={v => updateConfig('printDpi', v)}
                                isProcessing={isProcessing}
                            />
                        </div>

                        {/* Actions Card */}
                        <div className="bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[24px] p-5 shadow-2xl shadow-black/5 text-text-primary space-y-4">
                            <div className="flex justify-between items-center opacity-80 text-sm font-medium">
                                <span>Ready to save?</span>
                                {compressedInfo && (
                                    <span className="font-mono text-cyan-500">
                                        {formatBytes(compressedInfo.size_bytes)}
                                    </span>
                                )}
                            </div>
                            <Button
                                onClick={handleCompress}
                                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold shadow-lg shadow-primary/20 border-0 mb-3"
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Upscaling...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Upscale Now
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={downloadImage}
                                className="w-full bg-[var(--surface-overlay)] text-text-primary hover:bg-[var(--surface-elevated)] rounded-xl h-12 font-bold shadow-sm border border-[var(--border-subtle)]"
                                disabled={!compressedUrl}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Image
                            </Button>
                            <button
                                onClick={() => setOriginalFile(null)}
                                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors py-2"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Upscale Another
                            </button>
                        </div>
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
