"use client";

import React, { useState } from "react";

import { Zap, ShieldCheck, Scaling, Image } from "lucide-react";
import { ToolSidebar, ToolSidebarItem } from "@/components/ui/ToolSidebar";
import { m, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";

// Features
import dynamic from "next/dynamic";

const CompressImage = dynamic(() => import("@/components/features/pixels/CompressImage").then(mod => mod.CompressImage), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const UpscaleImage = dynamic(() => import("@/components/features/pixels/UpscaleImage").then(mod => mod.UpscaleImage), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const ResizeImage = dynamic(() => import("@/components/features/pixels/ResizeImage").then(mod => mod.ResizeImage), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const Steganography = dynamic(() => import("@/components/features/pixels/Steganography").then(mod => mod.Steganography), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });

export default function PixelsPage() {


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
        <div className="flex h-screen overflow-hidden bg-[color:var(--background)] relative">
            <ToolSidebar
                title="Pixels"
                items={tools}
                activeId={activeTool}
                onSelect={setActiveTool}
                isOpen={isSidebarOpen}
                onToggle={setSidebarOpen}
            />

            {/* Main Editor Area */}
            <main className="flex-1 overflow-hidden relative bg-transparent flex flex-col">
                <header className="h-14 border-b border-[color:var(--border-subtle)] bg-[var(--surface-overlay)] backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300">
                    <div className={cn("flex items-center gap-2 transition-all duration-300", !isSidebarOpen && "pl-12")}>
                        <div className="flex items-center text-sm text-[color:var(--text-muted)]">
                            <span className="font-semibold text-[color:var(--text-primary)] mr-2">Pixels</span>
                            <span className="text-[color:var(--text-muted)]">/</span>
                            <span className="ml-2">{activeToolLabel}</span>
                        </div>
                    </div>
                    <ReturnToToolsButton />

                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto h-full">
                        <AnimatePresence mode="wait">
                            {activeTool === 'compress' && (
                                <m.div
                                    key="compress"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <CompressImage />
                                </m.div>
                            )}

                            {activeTool === 'upscale' && (
                                <m.div
                                    key="upscale"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <UpscaleImage />
                                </m.div>
                            )}
                            {activeTool === 'resize' && (
                                <m.div
                                    key="resize"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <ResizeImage />
                                </m.div>
                            )}
                            {activeTool === 'stego' && (
                                <m.div
                                    key="stego"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <Steganography />
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
