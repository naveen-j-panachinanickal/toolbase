'use client';

/**
 * CommandPalette
 *
 * Global Cmd+K palette rendered via ReactDOM.createPortal so it always
 * floats above every stacking context.
 *
 * Behaviour:
 *  - Auto-focuses the search input on open
 *  - Shows "Recent Tools" (from useToolPreferences) when query is empty
 *  - Shows real-time filtered results (name + description + tags) while typing
 *  - Arrow keys move the highlighted row; Enter navigates; Escape closes
 *  - Backdrop click closes
 *  - WASM / Python badges shown per tool from registry metadata
 *  - Category colour-coded badges
 */

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
} from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Search, ArrowRight, Clock, Zap, Command } from 'lucide-react';
import { TOOLS, searchToolsFromRegistry } from '@/config/tools.registry';
import { useToolPreferences } from '@/hooks/useToolPreferences';
import { ToolMeta } from '@/types/tool-search';
import { cn } from '@/lib/utils';
import { getPinnedNotes } from '@/hooks/useNoteVault';
import { Note } from '@/types/note-vault';

// ─── category badge colours ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
    pdf: 'bg-red-100 text-red-600',
    image: 'bg-violet-100 text-violet-600',
    data: 'bg-blue-100 text-blue-600',
    security: 'bg-amber-100 text-amber-700',
    encode: 'bg-emerald-100 text-emerald-700',
    dev: 'bg-sky-100 text-sky-700',
    network: 'bg-indigo-100 text-indigo-700',
    draw: 'bg-pink-100 text-pink-600',
    utility: 'bg-slate-100 text-slate-600',
    snippet: 'bg-amber-100 text-amber-700',
};

function categoryColor(cat: string): string {
    return CATEGORY_COLORS[cat] ?? 'bg-slate-100 text-slate-600';
}

// ─── single result row ─────────────────────────────────────────────────────────

interface ResultRowProps {
    tool: ToolMeta;
    isHighlighted: boolean;
    onPointerEnter: () => void;
    onSelect: () => void;
}

function ResultRow({ tool, isHighlighted, onPointerEnter, onSelect }: ResultRowProps) {
    return (
        <button
            role="option"
            aria-selected={isHighlighted}
            onClick={onSelect}
            onPointerEnter={onPointerEnter}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left',
                'transition-colors duration-100 cursor-default',
            )}
            style={{
                background: isHighlighted ? 'var(--surface-active)' : 'transparent',
            }}
            onPointerLeave={(e) => { if (!isHighlighted) e.currentTarget.style.background = 'transparent'; }}
            onPointerOver={(e) => { if (!isHighlighted) e.currentTarget.style.background = 'var(--surface-hover)'; }}
            onPointerOut={(e) => { if (!isHighlighted) e.currentTarget.style.background = 'transparent'; }}
        >
            {/* Icon */}
            <div className="relative w-9 h-9 shrink-0">
                <Image
                    src={tool.thumbnail}
                    alt={tool.name}
                    fill
                    className="object-contain rounded-[10px] drop-shadow-sm"
                />
            </div>

            {/* Name + description */}
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {tool.name}
                </p>
                <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {tool.description}
                </p>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
                <span
                    className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                        categoryColor(tool.category)
                    )}
                >
                    {tool.category}
                </span>

                {tool.wasmPowered && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-600 border border-yellow-200">
                        <Zap size={8} className="fill-yellow-500" />
                        WASM
                    </span>
                )}
            </div>

            {/* Enter hint when highlighted */}
            {isHighlighted && (
                <ArrowRight size={14} className="shrink-0" style={{ color: 'var(--text-faint)' }} />
            )}
        </button>
    );
}

// ─── section label ─────────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
            <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                {label}
            </span>
        </div>
    );
}

// ─── main component ────────────────────────────────────────────────────────────

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const { recents } = useToolPreferences();
    const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);

    // ── compute display list ────────────────────────────────────────────────────

    const recentTools = useMemo(
        () =>
            recents
                .map((id) => TOOLS.find((t) => t.id === id))
                .filter((t): t is ToolMeta => t !== undefined),
        [recents]
    );

    const snippetTools = useMemo<ToolMeta[]>(() => {
        return pinnedNotes.map(n => ({
            id: `snippet-${n.id}`,
            name: n.title || 'Untitled Snippet',
            description: `Snippet (${n.format.toUpperCase()}) - Press Enter to copy to clipboard`,
            category: 'snippet' as any,
            route: `note-vault?id=${n.id}`,
            thumbnail: '/assets/thumbnails/developer.png',
            tags: n.tags || [],
            isNew: false,
            isFeatured: false,
            wasmPowered: false,
            pythonPowered: false,
            status: 'stable',
            addedAt: n.createdAt,
            mobileOptimized: true,
            tip: [],
            // Attach the original note content to the tool meta
            _originalNote: n,
        } as ToolMeta & { _originalNote?: Note }));
    }, [pinnedNotes]);

    const searchResults = useMemo(() => {
        if (!query.trim()) return snippetTools;
        const lowerQuery = query.toLowerCase();
        
        // Match snippets manually alongside tools registry search
        const matchedSnippets = snippetTools.filter(s => 
            s.name.toLowerCase().includes(lowerQuery) || 
            (s as any)._originalNote?.content.toLowerCase().includes(lowerQuery)
        );

        return [...matchedSnippets, ...searchToolsFromRegistry(query)];
    }, [query, snippetTools]);

    /** The flat list of rows the keyboard navigates */
    const flatList: ToolMeta[] = query.trim()
        ? searchResults
        : [...snippetTools, ...(recentTools.length > 0 ? recentTools : TOOLS.slice(0, 8))];

    // ── reset on open ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setHighlightedIndex(0);
            // Small delay so the portal has mounted
            setTimeout(() => inputRef.current?.focus(), 30);
            
            getPinnedNotes().then(setPinnedNotes);
        }
    }, [isOpen]);

    // ── reset highlight when list changes ──────────────────────────────────────

    useEffect(() => {
        setHighlightedIndex(0);
    }, [query]);

    // ── keyboard navigation ─────────────────────────────────────────────────────

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex((i) => Math.min(i + 1, flatList.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = flatList[highlightedIndex];
                if (selected) navigate(selected);
            }
        },
        [flatList, highlightedIndex] // eslint-disable-line react-hooks/exhaustive-deps
    );

    // ── scroll highlighted row into view ───────────────────────────────────────

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const highlighted = list.querySelector('[aria-selected="true"]') as HTMLElement;
        highlighted?.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex]);

    // ── navigation ──────────────────────────────────────────────────────────────

    const navigate = useCallback(
        (tool: ToolMeta & { _originalNote?: Note }) => {
            if (tool._originalNote) {
                // If it's a snippet, copy to clipboard instead of navigating
                navigator.clipboard.writeText(tool._originalNote.content);
                // Dispatch a custom event to trigger a toast or something similar
                window.dispatchEvent(new CustomEvent('TOOLBASE_TOAST', { detail: 'Snippet copied to clipboard!' }));
                onClose();
            } else {
                onClose();
                router.push(`/${tool.route}`);
            }
        },
        [onClose, router]
    );

    // ── portal target ───────────────────────────────────────────────────────────

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const portal = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <m.div
                        key="cp-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-9998 bg-black/20 backdrop-blur-sm"
                        aria-hidden="true"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <m.div
                        key="cp-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Command palette"
                        initial={{ opacity: 0, scale: 0.97, y: -12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -8 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className={cn(
                            'fixed z-9999 top-[12vh] left-1/2 -translate-x-1/2',
                            'w-full max-w-[580px] mx-4',
                            'backdrop-blur-2xl',
                            'rounded-2xl',
                            'overflow-hidden'
                        )}
                        style={{
                            background: 'var(--surface-overlay)',
                            border: '1px solid var(--border-medium)',
                            boxShadow: '0 24px 64px var(--shadow-heavy)',
                        }}
                    >
                        {/* Search input row */}
                        <div className="flex items-center gap-3 px-4 h-[56px]" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <Search size={18} className="shrink-0" style={{ color: 'var(--text-faint)' }} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search tools…"
                                autoComplete="off"
                                spellCheck={false}
                                className={cn(
                                    'flex-1 bg-transparent border-none outline-none',
                                    'text-[15px] font-medium',
                                )}
                                style={{ color: 'var(--text-primary)', caretColor: 'var(--text-muted)' }}
                                aria-autocomplete="list"
                                aria-controls="cp-results"
                                aria-activedescendant={
                                    flatList[highlightedIndex]
                                        ? `cp-row-${flatList[highlightedIndex].id}`
                                        : undefined
                                }
                            />
                            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium shrink-0" style={{ background: 'var(--kbd-bg)', color: 'var(--text-faint)' }}>
                                esc
                            </kbd>
                        </div>

                        {/* Results */}
                        <div
                            ref={listRef}
                            id="cp-results"
                            role="listbox"
                            aria-label="Tools"
                            className="overflow-y-auto overscroll-contain"
                            style={{ maxHeight: 'min(420px, 60vh)' }}
                        >
                            {/* Section label */}
                            {!query.trim() && recentTools.length > 0 && (
                                <SectionLabel
                                    icon={<Clock size={11} />}
                                    label="Recent"
                                />
                            )}
                            {!query.trim() && recentTools.length === 0 && (
                                <SectionLabel
                                    icon={<Command size={11} />}
                                    label="All Tools"
                                />
                            )}
                            {query.trim() && (
                                <SectionLabel
                                    icon={<Search size={11} />}
                                    label={`Results for "${query}"`}
                                />
                            )}

                            {/* Rows */}
                            <div className="px-2 pb-2">
                                {flatList.length > 0 ? (
                                    flatList.map((tool, i) => (
                                        <ResultRow
                                            key={tool.id}
                                            tool={tool}
                                            isHighlighted={i === highlightedIndex}
                                            onPointerEnter={() => setHighlightedIndex(i)}
                                            onSelect={() => navigate(tool)}
                                        />
                                    ))
                                ) : (
                                    <p className="py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                                        No tools match &ldquo;{query}&rdquo;
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer hint bar */}
                        <div className="flex items-center gap-4 px-4 h-9" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-hover)' }}>
                            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-faint)' }}>
                                <kbd className="px-1 rounded font-mono" style={{ background: 'var(--kbd-bg)' }}>↑↓</kbd>
                                navigate
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-faint)' }}>
                                <kbd className="px-1 rounded font-mono" style={{ background: 'var(--kbd-bg)' }}>↵</kbd>
                                open
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-faint)' }}>
                                <kbd className="px-1 rounded font-mono" style={{ background: 'var(--kbd-bg)' }}>esc</kbd>
                                close
                            </span>
                        </div>
                    </m.div>
                </>
            )}
        </AnimatePresence>
    );

    return ReactDOM.createPortal(portal, document.body);
}
