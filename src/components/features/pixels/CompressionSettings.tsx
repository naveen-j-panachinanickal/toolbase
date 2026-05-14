
import React from "react";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { Info, Zap, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompressionSettingsProps {
    mode: 'compress' | 'upscale';
    quality: number;
    setQuality: (val: number) => void;
    format: string;
    setFormat: (val: string) => void;
    resizeFactor: number;
    setResizeFactor: (val: number) => void;
    // Compress mode props
    enhance: boolean;
    setEnhance: (val: boolean) => void;
    stripMetadata?: boolean;
    setStripMetadata?: (val: boolean) => void;
    // Upscale mode new props
    denoise?: boolean;
    setDenoise?: (val: boolean) => void;
    vibrant?: boolean;
    setVibrant?: (val: boolean) => void;
    printDpi?: boolean;
    setPrintDpi?: (val: boolean) => void;

    isProcessing: boolean;
}

export function CompressionSettings({
    mode,
    quality,
    setQuality,
    format,
    setFormat,
    resizeFactor,
    setResizeFactor,
    enhance,
    setEnhance,
    stripMetadata,
    setStripMetadata,
    // Upscale props
    denoise,
    setDenoise,
    vibrant,
    setVibrant,
    printDpi,
    setPrintDpi,

    isProcessing
}: CompressionSettingsProps) {

    // Tabs configuration
    const formatTabs = [
        { id: "JPEG", label: "JPEG" },
        { id: "PNG", label: "PNG" },
        { id: "WEBP", label: "WEBP" },
    ];

    const getQualityLabel = (q: number) => {
        if (q >= 90) return "Lossless-like";
        if (q >= 70) return "High Quality";
        if (q >= 50) return "Balanced";
        return "Max Compression";
    };

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="space-y-8 p-0">

                {/* Format Selection */}
                <div className="space-y-4 p-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        File Format
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </label>
                    <div className="p-1 bg-gray-100/50 rounded-full w-fit">
                        <Tabs
                            tabs={formatTabs}
                            value={format}
                            onChange={(id) => setFormat(id)}
                            size="md"
                            radius="full"
                            colors={{
                                container: "bg-gray-100",
                                indicator: "bg-blue-600",
                                activeBackground: "bg-white",
                                label: {
                                    active: "text-blue-600",
                                },
                            }}
                        />
                    </div>
                </div>

                {/* Quality Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-sm font-semibold text-gray-700">Quality Level</label>
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-bold text-blue-600">{quality}%</span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{getQualityLabel(quality)}</span>
                        </div>
                    </div>
                    <div className="relative pt-2">
                        <Slider
                            min={1}
                            max={100}
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                            className="accent-blue-600 h-2"
                        />
                        <div className="flex justify-between text-[10px] text-gray-300 mt-2 font-mono">
                            <span>Smaller File</span>
                            <span>Better Looking</span>
                        </div>
                    </div>
                </div>

                {/* Resize Slider - Mode Dependent */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-sm font-semibold text-gray-700">Image Scale</label>
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {Math.round(resizeFactor * 100)}%
                        </span>
                    </div>

                    {mode === 'compress' ? (
                        <Slider
                            min={0.1}
                            max={1.0}
                            step={0.1}
                            value={resizeFactor}
                            onChange={(e) => setResizeFactor(Number(e.target.value))}
                            className="accent-emerald-500"
                        />
                    ) : (
                        <>
                            <Slider
                                min={1.0}
                                max={4.0}
                                step={0.25}
                                value={resizeFactor}
                                onChange={(e) => setResizeFactor(Number(e.target.value))}
                                className="accent-violet-500"
                            />

                            {/* New Upscale Features */}
                            <div className="space-y-3 mt-6">
                                {/* Denoise */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700">Reduce Noise</span>
                                        <span className="text-[10px] text-gray-400">Smooth out grain</span>
                                    </div>
                                    <Switch
                                        checked={denoise}
                                        onChange={(e) => setDenoise?.(e.target.checked)}
                                        className="data-[state=checked]:bg-violet-600"
                                    />
                                </div>

                                {/* Vibrant */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700">Vibrant Colors</span>
                                        <span className="text-[10px] text-gray-400">Boost saturation & punch</span>
                                    </div>
                                    <Switch
                                        checked={vibrant}
                                        onChange={(e) => setVibrant?.(e.target.checked)}
                                        className="data-[state=checked]:bg-violet-600"
                                    />
                                </div>

                                {/* Print Optimized */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700">Print Ready</span>
                                        <span className="text-[10px] text-gray-400">Optimize DPI (300)</span>
                                    </div>
                                    <Switch
                                        checked={printDpi}
                                        onChange={(e) => setPrintDpi?.(e.target.checked)}
                                        className="data-[state=checked]:bg-violet-600"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Auto Enhance + Strip Metadata — Compress Mode Only */}
                {mode === 'compress' && (
                    <div className="pt-4 pb-2 border-t border-gray-100 space-y-3">
                        {/* Auto Enhance */}
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-violet-50 transition-colors">
                                    <Zap className="w-4 h-4 text-gray-500 group-hover:text-violet-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">Auto Enhance</span>
                                    <span className="text-xs text-gray-400">Boost contrast &amp; sharpness</span>
                                </div>
                            </div>
                            <Switch
                                checked={enhance}
                                onChange={(e) => setEnhance(e.target.checked)}
                            />
                        </div>

                        {/* Strip Metadata */}
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                    <Settings2 className="w-4 h-4 text-gray-500 group-hover:text-blue-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">Strip Metadata</span>
                                    <span className="text-xs text-gray-400">Remove GPS &amp; Camera data</span>
                                </div>
                            </div>
                            <Switch
                                checked={stripMetadata ?? true}
                                onChange={(e) => setStripMetadata?.(e.target.checked)}
                            />
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
