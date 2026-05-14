'use client';

/**
 * PersonalizedGallery
 *
 * Two personalized sections above the tool grid:
 *   • "Your Favourites" — tools the user has hearted (with individual remove via ×)
 *   • "Recently Used"  — up to 5 last-visited tools (collapsible, clearable, individually removable)
 *
 * Sections only render when they have content.
 * All data lives in localStorage via useToolPreferences.
 * Tool IDs → card props resolved from allTools prop (no hardcoding).
 */

import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Clock, X, ChevronDown, Trash2 } from 'lucide-react';
import { useToolPreferences } from '@/hooks/useToolPreferences';
import { ToolCardProps } from '@/types/tool-search';
import { cn } from '@/lib/utils';

// ─── animation variants ────────────────────────────────────────────────────────

const slideVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: {
        opacity: 1,
        y: 0,
        height: 'auto',
        transition: { duration: 0.28, ease: 'easeOut' as const },
    },
    exit: {
        opacity: 0,
        y: -6,
        height: 0,
        transition: { duration: 0.2, ease: 'easeIn' as const },
    },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.85, y: 8 },
    visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 24,
            delay: i * 0.05,
        },
    }),
    exit: { opacity: 0, scale: 0.88, transition: { duration: 0.15 } },
};

// ─── mini card ─────────────────────────────────────────────────────────────────

interface MiniCardProps {
    card: ToolCardProps;
    index: number;
    onRemove: () => void;
    removeLabel: string;
}

function MiniCard({ card, index, onRemove, removeLabel }: MiniCardProps) {
    return (
        <m.div
            variants={cardVariants}
            custom={index}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            className="relative group/mini flex flex-col items-center gap-2"
            style={{ width: 68 }}
        >
            {/* Remove × button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove();
                }}
                aria-label={removeLabel}
                className={cn(
                    'absolute -top-1.5 -right-1.5 z-10',
                    'w-5 h-5 rounded-full',
                    'border shadow-sm',
                    'flex items-center justify-center',
                    'opacity-0 group-hover/mini:opacity-100',
                    'transition-all duration-150',
                    'hover:bg-red-50 hover:border-red-200'
                )}
                style={{
                    background: 'var(--surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                }}
            >
                <X size={10} style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Card link */}
            <Link
                href={card.route}
                className="flex flex-col items-center gap-2 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded-[18px]"
            >
                <div className="relative w-14 h-14 shrink-0">
                    <Image
                        src={card.icon as string}
                        alt={card.title}
                        fill
                        className={cn(
                            'rounded-[18px] object-contain p-1.5',
                            'filter drop-shadow-[0_3px_8px_rgba(0,0,0,0.12)]',
                            'group-hover/mini:scale-105 transition-transform duration-250'
                        )}
                    />
                </div>
                <span className="text-[11px] font-semibold text-center tracking-tight leading-tight line-clamp-2 w-full px-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {card.title}
                </span>
            </Link>
        </m.div>
    );
}

// ─── section label row ─────────────────────────────────────────────────────────

interface SectionLabelProps {
    icon: React.ReactNode;
    label: string;
    count: number;
    collapsible?: boolean;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    onClearAll?: () => void;
}

function SectionLabel({
    icon,
    label,
    count,
    collapsible,
    collapsed,
    onToggleCollapse,
    onClearAll,
}: SectionLabelProps) {
    return (
        <div className="flex items-center gap-2 mb-3 select-none">
            {/* Icon + title — clicking toggles collapse if collapsible */}
            <button
                onClick={collapsible ? onToggleCollapse : undefined}
                className={cn(
                    'flex items-center gap-2 flex-1 min-w-0',
                    collapsible ? 'cursor-pointer' : 'cursor-default pointer-events-none'
                )}
                aria-expanded={collapsible ? !collapsed : undefined}
            >
                <span style={{ color: 'var(--text-muted)' }} className="shrink-0">{icon}</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                    {label}
                </span>
                <span className="text-[11px] font-medium ml-0.5" style={{ color: 'var(--text-faint)' }}>
                    ({count})
                </span>
                {collapsible && (
                    <m.span
                        animate={{ rotate: collapsed ? -90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-1" style={{ color: 'var(--text-faint)' }}
                    >
                        <ChevronDown size={12} />
                    </m.span>
                )}
            </button>

            {onClearAll && (
                <button
                    onClick={onClearAll}
                    title={`Clear all ${label.toLowerCase()}`}
                    aria-label={`Clear all ${label.toLowerCase()}`}
                    className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-lg',
                        'text-[10px] font-medium',
                        'hover:bg-red-50 transition-all duration-150',
                        'border border-transparent hover:border-red-100'
                    )}
                    style={{ color: 'var(--text-muted)' }}
                >
                    <Trash2 size={10} />
                    <span>Clear</span>
                </button>
            )}
        </div>
    );
}

// ─── main component ────────────────────────────────────────────────────────────

interface PersonalizedGalleryProps {
    allTools: ToolCardProps[];
}

export function PersonalizedGallery({ allTools }: PersonalizedGalleryProps) {
    const { favorites, recents, toggleFavorite, clearFavorites, removeRecent, clearRecents } =
        useToolPreferences();

    const [favoritesCollapsed, setFavoritesCollapsed] = useState(false);
    const [recentsCollapsed, setRecentsCollapsed] = useState(false);

    // Resolve IDs → card props (preserving order)
    const favoriteCards = favorites
        .map((id) => allTools.find((t) => t.toolId === id))
        .filter((t): t is ToolCardProps => t !== undefined);

    const recentCards = recents
        .map((id) => allTools.find((t) => t.toolId === id))
        .filter((t): t is ToolCardProps => t !== undefined);

    const hasContent = favoriteCards.length > 0 || recentCards.length > 0;

    if (!hasContent) return null;

    return (
        <section aria-label="Your personalized tools" className="mb-6">
            <div className="space-y-5">

                {/* ── Favourites ───────────────────────────────────────── */}
                <AnimatePresence initial={false}>
                    {favoriteCards.length > 0 && (
                        <m.div
                            key="favorites-section"
                            variants={slideVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="overflow-hidden"
                        >
                            <SectionLabel
                                icon={<Heart size={12} className="fill-red-400 text-red-400" />}
                                label="Your Favourites"
                                count={favoriteCards.length}
                                collapsible
                                collapsed={favoritesCollapsed}
                                onToggleCollapse={() => setFavoritesCollapsed((v) => !v)}
                                onClearAll={clearFavorites}
                            />

                            {/* Collapsible cards area */}
                            <AnimatePresence initial={false}>
                                {!favoritesCollapsed && (
                                    <m.div
                                        key="favorites-cards"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{
                                            opacity: 1,
                                            height: 'auto',
                                            transition: { duration: 0.25, ease: 'easeOut' },
                                        }}
                                        exit={{
                                            opacity: 0,
                                            height: 0,
                                            transition: { duration: 0.18, ease: 'easeIn' },
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <m.div className="flex flex-wrap gap-5 pt-0.5" layout>
                                            <AnimatePresence mode="popLayout">
                                                {favoriteCards.map((card, i) => (
                                                    <MiniCard
                                                        key={card.toolId ?? card.route}
                                                        card={card}
                                                        index={i}
                                                        removeLabel={`Remove ${card.title} from favourites`}
                                                        onRemove={() => toggleFavorite(card.toolId ?? '')}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </m.div>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </m.div>
                    )}
                </AnimatePresence>

                {/* Recently Used removed - moved to Header Drawer */}

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
            </div>
        </section>
    );
}
