'use client';

import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Clock, X, Trash2, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToolPreferences } from '@/hooks/useToolPreferences';
import { TOOLS } from '@/config/tools.registry';
import { cn } from '@/lib/utils';

interface RecentsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RecentsDrawer({ isOpen, onClose }: RecentsDrawerProps) {
    const { recents, clearRecents, removeRecent } = useToolPreferences();

    // Resolve tool IDs to their metadata
    const recentTools = recents
        .map((id) => TOOLS.find((t) => t.id === id))
        .filter((t): t is typeof TOOLS[0] => t !== undefined);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-150 backdrop-blur-sm bg-black/20 dark:bg-black/40"
                    />

                    {/* Drawer */}
                    <m.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-[380px] z-160 shadow-2xl overflow-hidden flex flex-col"
                        style={{
                            background: 'var(--surface-overlay)',
                            backdropFilter: 'blur(32px)',
                            borderLeft: '1px solid var(--border-subtle)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                <h2 className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                    Recently Used
                                </h2>
                                <span className="text-[12px] font-medium px-1.5 py-0.5 rounded-md bg-red-600/10 text-red-600">
                                    {recents.length}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                <X size={18} style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
                            {recentTools.length > 0 ? (
                                <div className="space-y-2">
                                    <AnimatePresence mode="popLayout">
                                        {recentTools.map((tool) => (
                                            <m.div
                                                key={tool.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="relative group flex items-center"
                                            >
                                                <Link
                                                    href={tool.route}
                                                    onClick={onClose}
                                                    className="flex-1 flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                                                >
                                                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-800 p-2 border border-black/[0.03] dark:border-white/[0.03]">
                                                        <Image
                                                            src={tool.thumbnail}
                                                            alt={tool.name}
                                                            width={44}
                                                            height={44}
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-8">
                                                        <h3 className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                            {tool.name}
                                                        </h3>
                                                        <p className="text-[12px] line-clamp-1 opacity-60" style={{ color: 'var(--text-secondary)' }}>
                                                            {tool.description}
                                                        </p>
                                                    </div>
                                                    <ChevronRight
                                                        size={14}
                                                        className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                                                        style={{ color: 'var(--text-faint)' }}
                                                    />
                                                </Link>

                                                {/* Individual Remove Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        removeRecent(tool.id);
                                                    }}
                                                    className="absolute right-10 p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 transition-all duration-200"
                                                    title={`Remove ${tool.name} from history`}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </m.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center px-8 opacity-40">
                                    <div className="w-16 h-16 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
                                        <Clock size={32} style={{ color: 'var(--text-faint)' }} />
                                    </div>
                                    <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
                                        No recent tools yet
                                    </p>
                                    <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                                        Tools you use will appear here for quick access.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {recentTools.length > 0 && (
                            <div className="p-6 border-t border-white/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.01]">
                                <button
                                    onClick={clearRecents}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
                                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                                >
                                    <Trash2 size={14} />
                                    <span>Clear History</span>
                                </button>
                            </div>
                        )}
                    </m.div>
                </>
            )}
        </AnimatePresence>
    );
}
