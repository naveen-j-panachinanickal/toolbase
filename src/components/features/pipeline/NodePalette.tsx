import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { TIPToolRegistry } from '@/tip/registry';
import type { TIPContentType } from '@/tip/protocol';
import {
    Search, Upload, PackageCheck, ChevronLeft, ChevronRight,
    X, GripHorizontal, Zap, Filter, ShieldCheck
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * Drives what the NodePalette highlights.
 *
 * - `file`  → user uploaded a file; show tools that consume that MIME type.
 * - `node`  → a tool node is selected; show tools that consume what it produces.
 * - `none`  → no contextual filter; show everything.
 */
export type PaletteFilterContext =
    | { kind: 'file'; mimeType: string }
    | { kind: 'node'; produces: string[] }
    | { kind: 'none' };

// ── Statics ────────────────────────────────────────────────────────────────────

const TOOL_THUMBNAILS: Record<string, string> = {
    'magic-pdf': '/assets/thumbnails/magic-pdf.png',
    'pixels': '/assets/thumbnails/pixels.png',
    'redact-secrets': '/assets/thumbnails/redact-secrets.png',
    'base64': '/assets/thumbnails/b64EnDc.png',
    'data-lens': '/assets/thumbnails/data-lens.png',
    'json-to-interface': '/assets/thumbnails/json-to-interface.png',
};

const CATEGORY_META: Record<string, { label: string; color: string }> = {
    pdf: { label: 'PDF', color: '#ef4444' },
    image: { label: 'Image', color: '#a855f7' },
    security: { label: 'Security', color: '#f59e0b' },
    developer: { label: 'Dev', color: '#3b82f6' },
};

function getCategoryFromId(id: string): string {
    const prefix = id.split('/')[0];
    if (prefix === 'magic-pdf') return 'pdf';
    if (prefix === 'pixels') return 'image';
    if (prefix === 'redact-secrets') return 'security';
    return 'developer';
}

function getThumbnail(toolId: string): string | null {
    const prefix = toolId.split('/')[0];
    return TOOL_THUMBNAILS[prefix] ?? null;
}

/** Human-readable label for the active filter badge */
function filterLabel(ctx: PaletteFilterContext): string {
    if (ctx.kind === 'file') return ctx.mimeType.split('/')[1]?.toUpperCase() ?? ctx.mimeType;
    if (ctx.kind === 'node') {
        const types = ctx.produces
            .map(t => t.split('/')[1]?.toUpperCase() ?? t)
            .join(', ');
        return types;
    }
    return '';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

/** A single draggable tool card in the palette */
function PaletteToolCard({
    tool,
    onDragStart,
    dimmed = false,
    compatible = false,
    priority = false,
}: {
    tool: ReturnType<typeof TIPToolRegistry.getAll>[0];
    onDragStart: (e: React.DragEvent) => void;
    dimmed?: boolean;
    compatible?: boolean;
    priority?: boolean;
}) {
    const thumbnail = getThumbnail(tool.id);
    const category = getCategoryFromId(tool.id);
    const catMeta = CATEGORY_META[category] ?? CATEGORY_META.developer;
    const [hovered, setHovered] = useState(false);

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                cursor: 'grab',
                opacity: dimmed ? 0.3 : 1,
                background: compatible && !dimmed
                    ? hovered ? 'rgba(139,92,246,0.14)' : 'rgba(139,92,246,0.07)'
                    : hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                border: compatible && !dimmed
                    ? `1px solid ${hovered ? 'rgba(139,92,246,0.45)' : 'rgba(139,92,246,0.2)'}`
                    : `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.15s ease',
                userSelect: 'none',
            }}
        >
            {/* Icon */}
            {thumbnail ? (
                <div style={{
                    width: 32, height: 32, borderRadius: 8, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    flexShrink: 0, position: 'relative',
                    background: '#1a1a1e',
                }}>
                    <Image
                        src={thumbnail}
                        alt={tool.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="32px"
                        priority={priority}
                    />
                </div>
            ) : (
                <div style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: `${catMeta.color}18`, border: `1px solid ${catMeta.color}30`,
                    flexShrink: 0,
                }}>
                    <span style={{ fontSize: 16 }}>⚙️</span>
                </div>
            )}

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 11.5, fontWeight: 600, color: '#e5e7eb',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {tool.name}
                </div>
                <div style={{
                    fontSize: 9, color: catMeta.color,
                    textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2,
                    fontWeight: 600,
                }}>
                    {catMeta.label}
                </div>
            </div>

            {/* Compatible spark */}
            {compatible && !dimmed && (
                <Zap style={{ width: 11, height: 11, color: '#a78bfa', flexShrink: 0 }} />
            )}
            {(!compatible || dimmed) && (
                <GripHorizontal style={{ width: 13, height: 13, color: '#444', flexShrink: 0 }} />
            )}
        </div>
    );
}

/** Special node card (File Input / Output) */
function SpecialNodeCard({
    icon, label, subtitle, color, nodeType, toolId, onDragStart,
}: {
    icon: React.ReactNode;
    label: string;
    subtitle: string;
    color: string;
    nodeType: string;
    toolId?: string;
    onDragStart: (e: React.DragEvent, type: string, toolId?: string) => void;
}) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, nodeType, toolId)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10, cursor: 'grab',
                background: hovered ? `${color}12` : `${color}07`,
                border: `1px solid ${hovered ? `${color}35` : `${color}18`}`,
                transition: 'all 0.15s ease', userSelect: 'none',
            }}
        >
            <div style={{
                width: 32, height: 32, borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: `${color}15`, border: `1px solid ${color}25`,
                flexShrink: 0,
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#e5e7eb' }}>{label}</div>
                <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 1.5 }}>
                    {subtitle}
                </div>
            </div>
        </div>
    );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label, color }: { label: string; color: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 9, fontWeight: 700,
            color,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            padding: '0 2px 4px',
            borderBottom: `1px solid ${color}18`,
        }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
            {label}
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * NodePalette — Floating collapsible left-side panel with tool library.
 *
 * Accepts an optional `filterContext` that drives contextual highlighting:
 * - `file`  → show tools that consume the uploaded file's MIME type
 * - `node`  → show tools that consume what the selected node produces
 * - `none`  → show all tools equally (default)
 */
export function NodePalette({
    filterContext = { kind: 'none' },
}: {
    filterContext?: PaletteFilterContext;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDismissed, setFilterDismissed] = useState(false);

    // Reset dismissal whenever the filter context changes
    const filterKey = filterContext.kind === 'file'
        ? filterContext.mimeType
        : filterContext.kind === 'node'
            ? filterContext.produces.join(',')
            : '';

    const prevFilterKey = React.useRef(filterKey);
    if (prevFilterKey.current !== filterKey) {
        prevFilterKey.current = filterKey;
        if (filterKey) setFilterDismissed(false);
    }

    const activeFilter = !filterDismissed && filterContext.kind !== 'none';

    // ── Build the full tool list (search applied) ──
    const allTools = useMemo(() => {
        let list = TIPToolRegistry.getAll();
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(t =>
                t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
            );
        }
        return list;
    }, [search]);

    // ── Compute the set of compatible tool IDs ──
    const compatibleIds = useMemo((): Set<string> => {
        if (!activeFilter) return new Set();

        const mimeTypes: string[] = filterContext.kind === 'file'
            ? [filterContext.mimeType]
            : filterContext.kind === 'node'
                ? filterContext.produces
                : [];

        const ids = new Set<string>();
        mimeTypes.forEach(mime => {
            TIPToolRegistry.findConsumers(mime as TIPContentType).forEach(t => ids.add(t.id));
        });
        return ids;
    }, [activeFilter, filterContext]);

    // ── Split into compatible + rest ──
    const compatibleTools = useMemo(
        () => allTools.filter(t => compatibleIds.has(t.id)),
        [allTools, compatibleIds]
    );
    const otherTools = useMemo(
        () => allTools.filter(t => !compatibleIds.has(t.id)),
        [allTools, compatibleIds]
    );

    // For unfiltered view: group by category
    const grouped = useMemo(() => {
        if (activeFilter) return {};
        const acc: Record<string, typeof allTools> = {};
        allTools.forEach(t => {
            const cat = getCategoryFromId(t.id);
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(t);
        });
        return acc;
    }, [activeFilter, allTools]);

    const onDragStart = (e: React.DragEvent, nodeType: string, toolId?: string) => {
        e.dataTransfer.setData('application/reactflow', nodeType);
        if (toolId) e.dataTransfer.setData('application/toolId', toolId);
        e.dataTransfer.effectAllowed = 'move';
    };

    // ── Collapsed rail ──
    if (!isOpen) {
        return (
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                zIndex: 20, display: 'flex', alignItems: 'center', pointerEvents: 'none',
            }}>
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        pointerEvents: 'all',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: 4, marginLeft: 10,
                        width: 36, height: 80,
                        background: 'rgba(20,20,22,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(12px)',
                        transition: 'all 0.2s ease',
                    }}
                    title="Open tool palette"
                >
                    <span style={{ fontSize: 11, color: '#666', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.05em', fontWeight: 600 }}>Tools</span>
                    <ChevronRight style={{ width: 13, height: 13, color: '#555' }} />
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 20,
            width: 260, display: 'flex', flexDirection: 'column',
            background: 'rgba(14,14,16,0.97)',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
            boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
        }}>
            {/* Dark scrollbar */}
            <style>{`
                #tip-palette-scroll::-webkit-scrollbar { width: 4px; }
                #tip-palette-scroll::-webkit-scrollbar-track { background: transparent; }
                #tip-palette-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1); border-radius: 10px;
                }
                #tip-palette-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.22);
                }
                #tip-palette-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
            `}</style>

            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 14px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.02em' }}>
                        Tool Library
                    </div>
                    <div style={{ fontSize: 9.5, color: '#555', marginTop: 1 }}>
                        Drag tools onto the canvas
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 26, height: 26, borderRadius: 7,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                    }}
                >
                    <ChevronLeft style={{ width: 13, height: 13, color: '#666' }} />
                </button>
            </div>

            {/* Active filter badge */}
            {activeFilter && (
                <div style={{
                    margin: '8px 12px 0',
                    padding: '6px 9px',
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <Filter style={{ width: 10, height: 10, color: '#a78bfa', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 9.5, color: '#c4b5fd', fontWeight: 600 }}>
                            {filterContext.kind === 'file' ? 'File detected' : 'Node selected'}
                        </span>
                        <span style={{
                            fontSize: 9, color: '#7c5cc7', marginLeft: 5,
                            fontFamily: 'monospace', fontWeight: 600,
                        }}>
                            {filterLabel(filterContext)}
                        </span>
                    </div>
                    <button
                        onClick={() => setFilterDismissed(true)}
                        title="Clear filter"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', padding: 2,
                            flexShrink: 0,
                        }}
                    >
                        <X style={{ width: 10, height: 10, color: '#6b4fa0' }} />
                    </button>
                </div>
            )}

            {/* Search */}
            <div style={{ padding: activeFilter ? '8px 12px 0' : '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{
                        position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                        width: 13, height: 13, color: '#555',
                    }} />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '7px 9px 7px 28px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8,
                            color: '#e5e7eb',
                            fontSize: 12,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            style={{
                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
                            }}
                        >
                            <X style={{ width: 12, height: 12, color: '#555' }} />
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable content */}
            <div id="tip-palette-scroll" style={{
                flex: 1, overflowY: 'auto', padding: '12px',
                display: 'flex', flexDirection: 'column', gap: 16,
            }}>

                {/* ── FILTERED VIEW: compatible first, rest dimmed ── */}
                {activeFilter ? (
                    <>
                        {/* Compatible tools */}
                        {compatibleTools.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    fontSize: 9, fontWeight: 700, color: '#a78bfa',
                                    textTransform: 'uppercase', letterSpacing: '0.12em',
                                    padding: '0 2px 4px',
                                    borderBottom: '1px solid rgba(139,92,246,0.2)',
                                }}>
                                    <Zap style={{ width: 9, height: 9 }} />
                                    Compatible ({compatibleTools.length})
                                </div>
                                {compatibleTools.map((tool, i) => (
                                    <PaletteToolCard
                                        key={tool.id}
                                        tool={tool}
                                        compatible
                                        priority={i < 4}
                                        onDragStart={(e) => onDragStart(e, 'tool', tool.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* No compatible tools */}
                        {compatibleTools.length === 0 && (
                            <div style={{
                                padding: '14px 10px',
                                background: 'rgba(139,92,246,0.05)',
                                border: '1px solid rgba(139,92,246,0.15)',
                                borderRadius: 10, textAlign: 'center',
                            }}>
                                <Zap style={{ width: 18, height: 18, color: '#4b3a6e', margin: '0 auto 6px' }} />
                                <div style={{ fontSize: 11, color: '#6b4fa0', fontWeight: 600 }}>
                                    No compatible tools
                                </div>
                                <div style={{ fontSize: 9.5, color: '#444', marginTop: 3 }}>
                                    No tool consumes this type
                                </div>
                            </div>
                        )}

                        {/* Other tools — dimmed */}
                        {otherTools.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{
                                    fontSize: 9, fontWeight: 700, color: '#333',
                                    textTransform: 'uppercase', letterSpacing: '0.12em',
                                    padding: '0 2px 4px',
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    All Tools
                                </div>
                                {otherTools.map((tool, i) => (
                                    <PaletteToolCard
                                        key={tool.id}
                                        tool={tool}
                                        dimmed
                                        priority={!activeFilter && i < 4}
                                        onDragStart={(e) => onDragStart(e, 'tool', tool.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* ── UNFILTERED VIEW: special nodes + grouped ── */}
                        {(!search || 'file input output'.includes(search.toLowerCase())) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{
                                    fontSize: 9, fontWeight: 700, color: '#444',
                                    textTransform: 'uppercase', letterSpacing: '0.12em',
                                    padding: '0 2px 4px',
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    Pipeline Nodes
                                </div>
                                <SpecialNodeCard
                                    icon={<Upload style={{ width: 14, height: 14, color: '#4ade80' }} />}
                                    label="File Input"
                                    subtitle="Starting point"
                                    color="#4ade80"
                                    nodeType="fileInput"
                                    onDragStart={onDragStart}
                                />
                                <SpecialNodeCard
                                    icon={<PackageCheck style={{ width: 14, height: 14, color: '#34d399' }} />}
                                    label="Output"
                                    subtitle="Terminal / download"
                                    color="#34d399"
                                    nodeType="output"
                                    onDragStart={onDragStart}
                                />
                                <SpecialNodeCard
                                    icon={<ShieldCheck style={{ width: 14, height: 14, color: '#fbbf24' }} />}
                                    label="Human Review"
                                    subtitle="Manual approval gate"
                                    color="#fbbf24"
                                    nodeType="humanReview"
                                    toolId="system/human-review"
                                    onDragStart={onDragStart}
                                />
                            </div>
                        )}

                        {Object.entries(grouped).map(([cat, catTools]) => {
                            const meta = CATEGORY_META[cat] ?? CATEGORY_META.developer;
                            return (
                                <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <SectionHeader label={meta.label} color={meta.color} />
                                    {catTools.map((tool, i) => (
                                        <PaletteToolCard
                                            key={tool.id}
                                            tool={tool}
                                            priority={i < 2} // First few in each category
                                            onDragStart={(e) => onDragStart(e, 'tool', tool.id)}
                                        />
                                    ))}
                                </div>
                            );
                        })}

                        {Object.keys(grouped).length === 0 && search && (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', gap: 8, padding: '32px 16px', textAlign: 'center',
                            }}>
                                <Search style={{ width: 28, height: 28, color: '#333' }} />
                                <div style={{ fontSize: 12, color: '#555' }}>
                                    No tools found for &ldquo;{search}&rdquo;
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '10px 14px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <span style={{ fontSize: 9.5, color: '#444' }}>
                    {activeFilter
                        ? `${compatibleTools.length} of ${allTools.length} compatible`
                        : `${allTools.length} tools available`
                    }
                </span>
                {activeFilter && compatibleTools.length > 0 && (
                    <span style={{
                        fontSize: 9, color: '#6b4fa0', fontWeight: 600,
                        padding: '2px 7px',
                        background: 'rgba(139,92,246,0.1)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        borderRadius: 20,
                    }}>
                        {compatibleTools.length} match
                    </span>
                )}
            </div>
        </div>
    );
}
