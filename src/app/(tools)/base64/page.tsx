'use client';

import React from 'react';
import { Binary } from 'lucide-react';
import { m } from 'framer-motion';
import { Base64Workspace } from '@/components/features/base64/Base64Workspace';
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";

export default function Base64Page() {
    return (
        <div className="min-h-screen bg-(--background) relative overflow-hidden flex flex-col">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-(--primary) opacity-[0.03] blur-[120px] rounded-full" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-green-500 opacity-[0.03] blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col h-screen max-w-[1600px] mx-auto w-full px-6 py-8">
                <m.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-between shrink-0 mb-10"
                >
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-(--primary) blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative w-14 h-14 rounded-2xl bg-(--primary) flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 transform group-hover:scale-105 transition-transform">
                                <Binary className="w-8 h-8" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-(--text-primary) leading-tight mb-1">
                                Base64 <span className="text-(--primary)">Studio</span>
                            </h1>
                            <p className="text-sm text-(--text-tertiary) font-semibold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Professional grade encoding & decoding
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ReturnToToolsButton />
                    </div>
                </m.header>

                <main className="flex-1 min-h-0">
                    <Base64Workspace />
                </main>

                <footer className="mt-8 pt-6 border-t border-(--border-subtle) flex items-center justify-between text-[10px] font-bold text-(--text-tertiary) uppercase tracking-[0.2em] opacity-40 shrink-0">
                    <div className="flex items-center gap-4">
                        <span>Client-Side Encryption</span>
                        <div className="w-1 h-1 rounded-full bg-(--text-tertiary)" />
                        <span>No Data Leaves Your Browser</span>
                    </div>
                    <span>v2.0.0</span>
                </footer>
            </div>
        </div>
    );
}
