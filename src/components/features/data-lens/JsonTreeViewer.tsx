"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
    ChevronRight, ChevronDown, Braces, Brackets, Hash, Type, ToggleLeft,
    Calendar, Copy, Check, Search, X, FileJson, AlertCircle, CheckCircle2,
    Loader2
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue; }
type JsonArray = JsonValue[];

interface JsonTreeViewerProps {
    data: JsonValue;
    searchQuery?: string;
    onPathClick?: (path: string) => void;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getValueType(value: JsonValue): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'object': return <Braces className="w-3.5 h-3.5 text-purple-500" />;
        case 'array': return <Brackets className="w-3.5 h-3.5 text-blue-500" />;
        case 'number': return <Hash className="w-3.5 h-3.5 text-green-500" />;
        case 'string': return <Type className="w-3.5 h-3.5 text-amber-500" />;
        case 'boolean': return <ToggleLeft className="w-3.5 h-3.5 text-pink-500" />;
        case 'null': return <AlertCircle className="w-3.5 h-3.5 text-gray-400" />;
        default: return <FileJson className="w-3.5 h-3.5 text-gray-500" />;
    }
}

function getTypeColor(type: string): string {
    switch (type) {
        case 'object': return 'text-purple-600';
        case 'array': return 'text-blue-600';
        case 'number': return 'text-green-600';
        case 'string': return 'text-amber-600';
        case 'boolean': return 'text-pink-600';
        case 'null': return 'text-gray-400 italic';
        default: return 'text-gray-600';
    }
}

function formatValue(value: JsonValue, type: string): string {
    if (type === 'null') return 'null';
    if (type === 'string') return `"${value}"`;
    if (type === 'boolean') return value ? 'true' : 'false';
    if (type === 'object') return `{ ${Object.keys(value as JsonObject).length} keys }`;
    if (type === 'array') return `[ ${(value as JsonArray).length} items ]`;
    return String(value);
}

// ============================================================================
// JSON NODE COMPONENT
// ============================================================================

interface JsonNodeProps {
    keyName: string | number;
    value: JsonValue;
    path: string;
    depth: number;
    defaultExpanded?: boolean;
    searchQuery?: string;
    onPathClick?: (path: string) => void;
    showToast?: (message: string) => void;
}

function JsonNode({ keyName, value, path, depth, defaultExpanded = false, searchQuery, onPathClick, showToast }: JsonNodeProps) {
    const [expanded, setExpanded] = useState(defaultExpanded || depth < 2);
    const [copied, setCopied] = useState(false);

    // Sync expansion with parent
    React.useEffect(() => {
        setExpanded(defaultExpanded);
    }, [defaultExpanded]);

    const type = getValueType(value);
    const isExpandable = type === 'object' || type === 'array';
    const hasContent = isExpandable && (
        type === 'array' ? (value as JsonArray).length > 0 : Object.keys(value as JsonObject).length > 0
    );

    const matchesSearch = useMemo(() => {
        if (!searchQuery) return false;
        const query = searchQuery.toLowerCase();
        const keyMatch = String(keyName).toLowerCase().includes(query);
        const valueMatch = !isExpandable && String(value).toLowerCase().includes(query);
        return keyMatch || valueMatch;
    }, [searchQuery, keyName, value, isExpandable]);

    const copyPath = useCallback(() => {
        navigator.clipboard.writeText(path);
        setCopied(true);
        showToast?.("Path copied to clipboard!");
        setTimeout(() => setCopied(false), 1500);
    }, [path, showToast]);

    const copyValue = useCallback(() => {
        const text = isExpandable ? JSON.stringify(value, null, 2) : String(value);
        navigator.clipboard.writeText(text);
        setCopied(true);
        showToast?.("Value copied to clipboard!");
        setTimeout(() => setCopied(false), 1500);
    }, [value, isExpandable, showToast]);

    return (
        <div className="select-none">
            {/* Node Header */}
            <div
                className={`group flex items-center gap-1 py-1 px-2 rounded-md hover:bg-surface-overlay transition-colors cursor-pointer ${matchesSearch ? 'bg-primary/20 ring-1 ring-primary/50' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {/* Expand/Collapse Toggle */}
                {isExpandable && hasContent ? (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-0.5 rounded hover:bg-surface-overlay transition-colors"
                    >
                        {expanded ? (
                            <ChevronDown className="w-4 h-4 text-text-muted" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                        )}
                    </button>
                ) : (
                    <span className="w-5" />
                )}

                {/* Type Icon */}
                {getTypeIcon(type)}

                {/* Key Name */}
                <span
                    className="font-medium text-text-primary cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onPathClick?.(path)}
                    title={`Click to copy path: ${path}`}
                >
                    {typeof keyName === 'number' ? `[${keyName}]` : keyName}
                </span>

                <span className="text-text-muted mx-1">:</span>

                {/* Value Preview */}
                <span className={`text-sm ${getTypeColor(type)} ${isExpandable ? 'opacity-70' : ''}`}>
                    {formatValue(value, type)}
                </span>

                {/* Type Badge */}
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-surface-secondary text-text-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {type}
                </span>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={copyPath}
                        className="p-1 rounded text-text-muted hover:text-primary hover:bg-surface-overlay transition-colors"
                        title="Copy path"
                    >
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {/* Children */}
            {isExpandable && expanded && hasContent && (
                <div className="border-l border-border-subtle ml-4" style={{ marginLeft: `${depth * 16 + 20}px` }}>
                    {type === 'array' ? (
                        (value as JsonArray).map((item, index) => (
                            <JsonNode
                                key={index}
                                keyName={index}
                                value={item}
                                path={`${path}[${index}]`}
                                depth={depth + 1}
                                searchQuery={searchQuery}
                                onPathClick={onPathClick}
                                showToast={showToast}
                            />
                        ))
                    ) : (
                        Object.entries(value as JsonObject).map(([k, v]) => (
                            <JsonNode
                                key={k}
                                keyName={k}
                                value={v}
                                path={path ? `${path}.${k}` : k}
                                depth={depth + 1}
                                searchQuery={searchQuery}
                                onPathClick={onPathClick}
                                showToast={showToast}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MAIN JSON TREE VIEWER
// ============================================================================

export function JsonTreeViewer({ data, onPathClick }: JsonTreeViewerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandAll, setExpandAll] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    const showToast = useCallback((message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
    }, []);

    const handleExpandToggle = useCallback(() => {
        setIsTransitioning(true);
        // Use timeout to allow the loading state to render before the heavy tree update
        setTimeout(() => {
            setExpandAll(prev => !prev);
            setIsTransitioning(false);
        }, 100);
    }, []);

    // Parse data if it's a string
    const jsonData = useMemo(() => {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        }
        return data;
    }, [data]);

    const handlePathClick = useCallback((path: string) => {
        navigator.clipboard.writeText(path);
        showToast("Path copied to clipboard!");
        onPathClick?.(path);
    }, [onPathClick, showToast]);

    if (!jsonData) {
        return (
            <div className="flex items-center justify-center h-64 text-text-muted">
                <FileJson className="w-12 h-12 opacity-30" />
                <p className="ml-4">No JSON data to display</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Toolbar */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border-subtle bg-surface-secondary">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 bg-surface border border-border-medium rounded-lg text-sm text-text-primary placeholder-(--text-faint) focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                        placeholder="Search keys or values..."
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                    {Array.isArray(jsonData) ? (
                        <span className="flex items-center gap-1.5">
                            <Brackets className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-semibold text-blue-600">{jsonData.length}</span> items
                        </span>
                    ) : typeof jsonData === 'object' && jsonData !== null ? (
                        <span className="flex items-center gap-1.5">
                            <Braces className="w-3.5 h-3.5 text-purple-500" />
                            <span className="font-semibold text-purple-600">{Object.keys(jsonData).length}</span> keys
                        </span>
                    ) : null}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExpandToggle}
                        disabled={isTransitioning}
                        className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface border border-border-medium rounded-lg hover:bg-surface-overlay transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {isTransitioning ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : null}
                        {expandAll ? 'Collapse All' : 'Expand All'}
                    </button>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
                            showToast("JSON copied to clipboard!");
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface border border-border-medium rounded-lg hover:bg-surface-overlay transition-colors flex items-center gap-1.5"
                    >
                        <Copy className="w-3 h-3" /> Copy JSON
                    </button>
                </div>
            </div>

            {/* Tree View */}
            <div className="relative flex-1 overflow-auto p-4 font-mono text-sm">
                {isTransitioning && (
                    <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 p-4 bg-surface-elevated rounded-xl shadow-lg border border-border-subtle">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <span className="text-sm font-medium text-text-secondary">
                                {expandAll ? 'Collapsing...' : 'Expanding...'}
                            </span>
                        </div>
                    </div>
                )}
                {Array.isArray(jsonData) ? (
                    jsonData.map((item, index) => (
                        <JsonNode
                            key={index}
                            keyName={index}
                            value={item}
                            path={`$[${index}]`}
                            depth={0}
                            defaultExpanded={expandAll}
                            searchQuery={searchQuery}
                            onPathClick={handlePathClick}
                            showToast={showToast}
                        />
                    ))
                ) : typeof jsonData === 'object' && jsonData !== null ? (
                    Object.entries(jsonData).map(([key, value]) => (
                        <JsonNode
                            key={key}
                            keyName={key}
                            value={value as JsonValue}
                            path={`$.${key}`}
                            depth={0}
                            defaultExpanded={expandAll}
                            searchQuery={searchQuery}
                            onPathClick={handlePathClick}
                            showToast={showToast}
                        />
                    ))
                ) : (
                    <div className="text-text-primary">{String(jsonData)}</div>
                )}
            </div>

            {/* Toast Notification */}
            {toast.visible && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-surface-inverse text-text-inverse rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-border-subtle">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* Quick Help */}
            <div className="px-4 py-2 border-t border-border-subtle bg-surface-secondary text-xs text-text-secondary">
                <span className="font-medium">Tip:</span> Click on a key to copy its JSONPath. Use paths like <code className="px-1 py-0.5 bg-surface-overlay rounded text-text-primary border border-border-subtle">$.orders[0].customer.name</code> in Python queries.
            </div>
        </div>
    );
}

export default JsonTreeViewer;
