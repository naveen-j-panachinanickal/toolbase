import React, { useState, useEffect, useMemo } from "react";
import { FileUploader } from "@/components/ui/FileUploader";
import { Button } from "@/components/ui/Button";
import {
    Download, RefreshCw, Zap, Settings2, Lock, Unlock,
    Smartphone, Monitor
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { formatBytes, cn } from "@/lib/utils";
import { ImagePreview } from "@/components/features/pixels/ImagePreview";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { useTIPTool } from "@/hooks/useTIPTool";
import { getImageInfo } from "@/lib/image-utils";


const SOCIAL_PRESETS = [
    { id: "ig_post", name: "IG Post", width: 1080, height: 1080, icon: Smartphone },
    { id: "ig_story", name: "IG Story", width: 1080, height: 1920, icon: Smartphone },
    { id: "twitter_header", name: "Twitter Header", width: 1500, height: 500, icon: Monitor },
    { id: "fb_cover", name: "Facebook Cover", width: 820, height: 312, icon: Monitor },
    { id: "yt_thumb", name: "YouTube Thumb", width: 1280, height: 720, icon: Monitor },
];

export function ResizeImage() {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [originalInfo, setOriginalInfo] = useState<any>(null);
    const [aspectRatio, setAspectRatio] = useState(1);

    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [processedInfo, setProcessedInfo] = useState<any>(null);

    // Dimension state (local — not schema-driven, changes dynamically based on image)
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [lockAspectRatio, setLockAspectRatio] = useState(true);
    const [percentage, setPercentage] = useState(100);
    const [resizeMode, setResizeMode] = useState("dimensions"); // dimensions | percentage | social
    const [fitMode, setFitMode] = useState<'stretch' | 'contain'>('stretch');

    // Engine Hook — format + fillColor defaults come from the TIP schema
    const { execute, isProcessing, error, tool } = useTIPTool('pixels/resize');
    const isReady = true;

    const defaultConfig = useMemo(
        () => Object.fromEntries(
            (tool?.configSchema.fields ?? []).map(f => [f.key, f.default])
        ),
        [tool]
    );

    const [config, setConfig] = useState<Record<string, any>>(defaultConfig);
    const updateConfig = (key: string, value: any) =>
        setConfig(prev => ({ ...prev, [key]: value }));

    const seededRef = React.useRef(false);
    useEffect(() => {
        if (!seededRef.current && Object.keys(defaultConfig).length > 0) {
            setConfig(defaultConfig);
            seededRef.current = true;
        }
    }, [defaultConfig]);


    // Cleanup
    useEffect(() => {
        return () => {
            if (originalUrl) URL.revokeObjectURL(originalUrl);
            if (processedUrl) URL.revokeObjectURL(processedUrl);
        };
    }, [originalUrl, processedUrl]);

    // Handle File Selection
    const handleFileSelect = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];

        if (originalUrl) URL.revokeObjectURL(originalUrl);
        if (processedUrl) URL.revokeObjectURL(processedUrl);
        setProcessedUrl(null);
        setProcessedInfo(null);

        setOriginalFile(file);
        setOriginalUrl(URL.createObjectURL(file));

        try {
            const info = await getImageInfo(file);
            setOriginalInfo(info);
            setAspectRatio(info.width / info.height);
            setWidth(info.width);
            setHeight(info.height);

            // Auto-detect format and update config
            const detectedFormat = info.format && ["JPEG", "PNG", "WEBP"].includes(info.format)
                ? info.format
                : "JPEG";
            setConfig(prev => ({ ...prev, format: detectedFormat }));
        } catch (err) {
            console.error(err);
        }
    };

    // Handle Dimension Changes
    const handleWidthChange = (val: number) => {
        setWidth(val);
        if (lockAspectRatio) {
            setHeight(Math.round(val / aspectRatio));
        }
    };

    const handleHeightChange = (val: number) => {
        setHeight(val);
        if (lockAspectRatio) {
            setWidth(Math.round(val * aspectRatio));
        }
    };

    // Handle Percentage Change
    useEffect(() => {
        if (resizeMode === "percentage" && originalInfo) {
            const factor = percentage / 100;
            setWidth(Math.round(originalInfo.width * factor));
            setHeight(Math.round(originalInfo.height * factor));
        }
    }, [percentage, resizeMode, originalInfo]);

    const handleFillColorChange = (c: string) => {
        updateConfig('fillColor', c);
        // If transparent fill, JPEG can't support it — switch to PNG
        if (c === 'transparent' && String(config.format) === 'JPEG') {
            updateConfig('format', 'PNG');
        }
    };

    // Handle Preset Selection
    const handlePresetSelect = (presetId: string) => {
        const preset = SOCIAL_PRESETS.find(p => p.id === presetId);
        if (preset) {
            setWidth(preset.width);
            setHeight(preset.height);
            // Don't lock aspect ratio for presets as they might distort if enforced
            // But usually resize involves cropping for aspect ratio matching?
            // "Image Resizer" typically just stretches or fits.
            // Pixels plain resize creates stretch if AR doesn't match.
            // For now, allow independent dimensions.
            setLockAspectRatio(false);
        }
    };

    const handleResize = async () => {
        if (!originalFile) return;

        try {
            const resizeConfig = {
                ...config,
                width,
                height,
                mode: fitMode,
                fillColor: config.fillColor,
            };

            const outputFiles = await execute([originalFile], resizeConfig);

            if (outputFiles && outputFiles.length > 0) {
                const blob = outputFiles[0];
                const url = URL.createObjectURL(blob);

                if (processedUrl) URL.revokeObjectURL(processedUrl);
                setProcessedUrl(url);
                setProcessedInfo({
                    size_bytes: blob.size,
                    width,
                    height
                });
            }

        } catch (err) {
            console.error("Resize failed", err);
        }
    };

    const downloadImage = () => {
        if (!processedUrl) return;
        const link = document.createElement('a');
        link.href = processedUrl;
        link.download = `resized-image.${String(config.format ?? 'jpeg').toLowerCase()}`;
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
                            Resize Images <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-cyan-500">To Perfect Dimensions</span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
                            Pixel-perfect resizing for social media, web, and print.
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
                                    compressedUrl={processedUrl}
                                    originalInfo={originalInfo}
                                    compressedInfo={processedInfo}
                                    isProcessing={isProcessing}
                                    mode="resize"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Settings Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-[var(--surface-elevated)] rounded-[32px] p-6 shadow-xl shadow-black/5 dark:shadow-black/20 border border-[var(--border-subtle)] flex-1">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 bg-primary/10 rounded-xl">
                                        <Settings2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text-primary">Resize Dimensions</h3>
                                        <p className="text-xs text-text-muted">Adjust width and height</p>
                                    </div>
                                </div>

                                {/* Tabs for Mode */}
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    {['dimensions', 'percentage', 'social'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setResizeMode(m)}
                                            className={cn(
                                                "flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all",
                                                resizeMode === m ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>

                                {resizeMode === 'dimensions' && (
                                    <div className="space-y-4">
                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1 space-y-2">
                                                <Label>Width (px)</Label>
                                                <Input
                                                    type="number"
                                                    value={width}
                                                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                                                    className="bg-gray-50 border-gray-200"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setLockAspectRatio(!lockAspectRatio)}
                                                className={cn("p-2 mb-1 rounded-lg transition-colors", lockAspectRatio ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-400")}
                                            >
                                                {lockAspectRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                            </button>
                                            <div className="flex-1 space-y-2">
                                                <Label>Height (px)</Label>
                                                <Input
                                                    type="number"
                                                    value={height}
                                                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                                                    className="bg-gray-50 border-gray-200"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {resizeMode === 'percentage' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <Label>Scale Percentage</Label>
                                            <span className="text-sm font-mono text-cyan-600">{percentage}%</span>
                                        </div>
                                        <Slider
                                            value={percentage}
                                            onChange={(e: any) => setPercentage(Number(e.target.value))}
                                            min={1}
                                            max={200}
                                            step={1}
                                            className="accent-cyan-600 py-4"
                                        />
                                        <div className="text-xs text-gray-500 text-center">
                                            Result: {width} x {height} px
                                        </div>
                                    </div>
                                )}

                                {resizeMode === 'social' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {SOCIAL_PRESETS.map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => handlePresetSelect(preset.id)}
                                                className={cn(
                                                    "p-3 rounded-xl border text-left transition-all space-y-1 hover:border-cyan-300 hover:bg-cyan-50",
                                                    (width === preset.width && height === preset.height)
                                                        ? "border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500"
                                                        : "border-gray-200 bg-gray-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                                    <preset.icon className="w-3 h-3" />
                                                    {preset.name}
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-mono">
                                                    {preset.width}x{preset.height}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Fit Mode (Background Fill) - Only for Dimensions & Social */}
                                {resizeMode !== 'percentage' && (
                                    <div className="space-y-3 pt-4 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <Label>Fit Mode</Label>
                                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setFitMode('stretch')}
                                                    className={cn("px-3 py-1 text-xs rounded-md transition-all", fitMode === 'stretch' ? "bg-white shadow text-cyan-700" : "text-gray-500")}
                                                >
                                                    Stretch
                                                </button>
                                                <button
                                                    onClick={() => setFitMode('contain')}
                                                    className={cn("px-3 py-1 text-xs rounded-md transition-all", fitMode === 'contain' ? "bg-white shadow text-cyan-700" : "text-gray-500")}
                                                >
                                                    Fill (Contain)
                                                </button>
                                            </div>
                                        </div>

                                        {fitMode === 'contain' && (
                                            <div className="space-y-2">
                                                <Label className="text-xs text-gray-500">Background Color</Label>
                                                <ColorPicker
                                                    value={String(config.fillColor ?? 'transparent')}
                                                    onChange={handleFillColorChange}
                                                    allowTransparent={true}
                                                    className="w-full bg-white p-2 rounded-lg border border-gray-200"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label>Format</Label>
                                            <span className="text-xs text-gray-400">{String(config.format ?? 'JPEG')}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {['JPEG', 'PNG', 'WEBP'].map(fmt => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => updateConfig('format', fmt)}
                                                    className={cn(
                                                        "flex-1 py-2 text-xs font-bold rounded-lg border transition-all",
                                                        config.format === fmt
                                                            ? "bg-slate-800 text-white border-slate-800"
                                                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                    )}
                                                >
                                                    {fmt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label>Quality</Label>
                                            <span className="text-sm text-gray-500">{Number(config.quality ?? 90)}%</span>
                                        </div>
                                        <Slider
                                            value={Number(config.quality ?? 90)}
                                            onChange={(e: any) => updateConfig('quality', Number(e.target.value))}
                                            min={10}
                                            max={100}
                                            step={1}
                                            className="accent-cyan-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Card */}
                        <div className="bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[24px] p-5 shadow-2xl shadow-black/5 text-text-primary space-y-4">
                            <div className="flex justify-between items-center opacity-80 text-sm font-medium">
                                <span>Ready to save?</span>
                                {processedInfo && (
                                    <span className="font-mono text-cyan-500">
                                        {formatBytes(processedInfo.size_bytes)}
                                    </span>
                                )}
                            </div>
                            <Button
                                onClick={handleResize}
                                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold shadow-lg shadow-primary/20 border-0 mb-3"
                                disabled={isProcessing || !originalFile || width === 0 || height === 0}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Resizing...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Resize Now
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={downloadImage}
                                className="w-full bg-[var(--surface-overlay)] text-text-primary hover:bg-[var(--surface-elevated)] rounded-xl h-12 font-bold shadow-sm border border-[var(--border-subtle)]"
                                disabled={!processedUrl}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Image
                            </Button>
                            <button
                                onClick={() => setOriginalFile(null)}
                                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors py-2"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Resize Another
                            </button>
                        </div>
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
