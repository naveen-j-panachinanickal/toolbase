"use client";

import { ToolCardProps } from '@/types/tool-search';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { Pin } from 'lucide-react';
import { usePinnedTools } from '@/hooks/usePinnedTools';
import { cn } from '@/lib/utils';
import { FavoriteButton } from './FavoriteButton';
import { useToolPreferences } from '@/hooks/useToolPreferences';
import { m } from 'framer-motion';

const ToolCard: React.FC<ToolCardProps & { priority?: boolean }> = ({ title, route, icon, toolId, priority }) => {
    const { isPinned, togglePin } = usePinnedTools();
    const { isFavorite } = useToolPreferences();
    const pinned = isPinned(route || '');
    const favorited = toolId ? isFavorite(toolId) : false;

    const handlePinClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        togglePin(route || '');
    };

    return (
        <m.div
            className="relative group/card p-4 rounded-3xl"
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 22 } }}
            whileTap={{ scale: 0.95, y: 0, transition: { duration: 0.1 } }}
        >
            {/* ── Favourite Button (top-left) ─────────────────────────────── */}
            {toolId && (
                <FavoriteButton
                    toolId={toolId}
                    className={cn(
                        'absolute top-2 left-2 z-20 transition-all duration-200',
                        favorited
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 group-hover/card:opacity-100 scale-90 group-hover/card:scale-100'
                    )}
                />
            )}

            {/* ── Pin Button (top-right) ──────────────────────────────────── */}
            <button
                onClick={handlePinClick}
                className={cn(
                    "absolute top-2 right-2 z-20 p-2 rounded-full transition-all duration-300",
                    pinned
                        ? "opacity-100"
                        : "opacity-0 group-hover/card:opacity-100",
                    "backdrop-blur-sm shadow-sm"
                )}
                title={pinned ? "Unpin tool" : "Pin to dock"}
                style={{
                    background: pinned ? 'var(--surface-active)' : 'var(--surface-hover)',
                    color: pinned ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
            >
                <Pin
                    size={14}
                    className={cn(
                        "transition-transform duration-300",
                        pinned ? "fill-current rotate-0" : "-rotate-45"
                    )}
                />
            </button>

            {/* ── Card Link ──────────────────────────────────────────────── */}
            <Link
                href={route}
                className="relative z-10 flex flex-col items-center gap-4 cursor-pointer"
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    <m.div
                        whileHover={{ scale: 1.12 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                    >
                        <Image
                            src={icon}
                            alt={title}
                            width={80}
                            height={80}
                            priority={priority}
                            className="w-20 h-20 rounded-[25px] p-1.5 object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
                        />
                    </m.div>
                </div>
                <p className="text-[13px] font-semibold text-center transition-colors tracking-tight" style={{ color: 'var(--text-secondary)' }}>
                    {title}
                </p>
            </Link>
        </m.div>
    );
};

export default ToolCard;

