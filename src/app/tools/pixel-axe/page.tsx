"use client";

import React, { useState } from "react";
import { usePixelAxe } from "@/hooks/usePixelAxe";
import { Zap, ShieldCheck, Scaling, Image } from "lucide-react";
import { ToolSidebar, ToolSidebarItem } from "@/components/ui/ToolSidebar";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Features
import { CompressImage } from "@/components/features/pixel-axe/CompressImage";
import { UpscaleImage } from "@/components/features/pixel-axe/UpscaleImage";
import { ResizeImage } from "@/components/features/pixel-axe/ResizeImage";
import { Steganography } from "@/components/features/pixel-axe/Steganography";

export default function PixelAxePage() {
    const { isReady, isProcessing, error, compressImage, getImageInfo, resizeImage, hideText, revealText } = usePixelAxe();

    // Sidebar State
    const [activeTool, setActiveTool] = useState('compress');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const tools: ToolSidebarItem[] = [
        { id: 'compress', label: 'Compress Image', icon: Zap },
        { id: 'upscale', label: 'Upscale Image', icon: Scaling, badge: "Beta" },
        { id: 'resize', label: 'Resize Image', icon: Image },
        { id: 'stego', label: 'Hide Data in Img', icon: ShieldCheck, badge: "New" },
    ];

    const activeToolLabel = tools.find(t => t.id === activeTool)?.label || 'Tool';

    return (
        <div className="flex h-screen overflow-hidden bg-[#FDFDFD] relative">
            <ToolSidebar
                title="Pixel Axe"
                items={tools}
                activeId={activeTool}
                onSelect={setActiveTool}
                isOpen={isSidebarOpen}
                onToggle={setSidebarOpen}
            />

            {/* Main Editor Area */}
            <main className="flex-1 overflow-hidden relative bg-gray-50/30 flex flex-col">
                <header className="h-14 border-b border-gray-200/50 bg-white/50 backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300">
                    <div className={cn("flex items-center gap-2 transition-all duration-300", !isSidebarOpen && "pl-12")}>
                        <div className="flex items-center text-sm text-gray-500">
                            <span className="font-semibold text-gray-800 mr-2">Pixel Axe</span>
                            <span className="text-gray-300">/</span>
                            <span className="ml-2">{activeToolLabel}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100/50 shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Client-Side Secure</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto h-full">
                        <AnimatePresence mode="wait">
                            {activeTool === 'compress' && (
                                <motion.div
                                    key="compress"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <CompressImage
                                        compressImage={compressImage}
                                        getImageInfo={getImageInfo}
                                        isProcessing={isProcessing}
                                        isReady={isReady}
                                    />
                                </motion.div>
                            )}

                            {activeTool === 'upscale' && (
                                <motion.div
                                    key="upscale"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <UpscaleImage
                                        compressImage={compressImage}
                                        getImageInfo={getImageInfo}
                                        isProcessing={isProcessing}
                                        isReady={isReady}
                                    />
                                </motion.div>
                            )}
                            {activeTool === 'resize' && (
                                <motion.div
                                    key="resize"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <ResizeImage
                                        resizeImage={resizeImage}
                                        getImageInfo={getImageInfo}
                                        isProcessing={isProcessing}
                                        isReady={isReady}
                                    />
                                </motion.div>
                            )}
                            {activeTool === 'stego' && (
                                <motion.div
                                    key="stego"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <Steganography
                                        hideText={hideText}
                                        revealText={revealText}
                                        getImageInfo={getImageInfo}
                                        isProcessing={isProcessing}
                                        isReady={isReady}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
