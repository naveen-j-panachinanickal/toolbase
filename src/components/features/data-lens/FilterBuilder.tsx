
import React, { useState, useCallback } from "react";
import {
    X, Plus, Filter, Play, Trash2, ChevronDown, ChevronUp,
    Copy, Save, RotateCcw, Sparkles, Search, Hash, Calendar,
    Type, ToggleLeft, AlertCircle
} from "lucide-react";
import { TableSchema } from "@/hooks/useDataLens";
import { Button } from "@/components/ui/Button";

export interface FilterCondition {
    id: string;
    column: string;
    operator: string;
    value: string;
    value2?: string; // For BETWEEN operator
    logic?: 'AND' | 'OR';
}

interface FilterBuilderProps {
    schema: TableSchema | undefined;
    onApply: (conditions: FilterCondition[]) => void;
}

// Comprehensive operator list by data type
const OPERATORS = {
    string: [
        { label: 'Contains', value: 'contains', icon: '∋' },
        { label: 'Does not contain', value: 'not_contains', icon: '∌' },
        { label: 'Equals', value: 'equals', icon: '=' },
        { label: 'Not equals', value: 'not_equals', icon: '≠' },
        { label: 'Starts with', value: 'startswith', icon: 'A..' },
        { label: 'Ends with', value: 'endswith', icon: '..Z' },
        { label: 'Is empty', value: 'is_empty', icon: '∅' },
        { label: 'Is not empty', value: 'is_not_empty', icon: '≠∅' },
        { label: 'Matches regex', value: 'regex', icon: '.*' },
        { label: 'In list', value: 'in_list', icon: '[]' },
    ],
    number: [
        { label: 'Equals', value: 'eq', icon: '=' },
        { label: 'Not equals', value: 'neq', icon: '≠' },
        { label: 'Greater than', value: 'gt', icon: '>' },
        { label: 'Less than', value: 'lt', icon: '<' },
        { label: 'Greater or equal', value: 'gte', icon: '≥' },
        { label: 'Less or equal', value: 'lte', icon: '≤' },
        { label: 'Between', value: 'between', icon: '↔' },
        { label: 'Is null', value: 'is_null', icon: '∅' },
        { label: 'Is not null', value: 'is_not_null', icon: '≠∅' },
    ],
    date: [
        { label: 'Equals', value: 'date_eq', icon: '=' },
        { label: 'Before', value: 'date_before', icon: '<' },
        { label: 'After', value: 'date_after', icon: '>' },
        { label: 'Between', value: 'date_between', icon: '↔' },
        { label: 'Is today', value: 'is_today', icon: '📅' },
        { label: 'Is this week', value: 'is_this_week', icon: '📆' },
        { label: 'Is this month', value: 'is_this_month', icon: '🗓' },
    ],
    boolean: [
        { label: 'Is true', value: 'is_true', icon: '✓' },
        { label: 'Is false', value: 'is_false', icon: '✗' },
    ]
};

// Quick filter presets
const QUICK_FILTERS = [
    { label: 'Non-empty values', icon: '≠∅', operator: 'is_not_empty' },
    { label: 'Empty values', icon: '∅', operator: 'is_empty' },
    { label: 'Numeric > 0', icon: '>0', operator: 'gt', value: '0' },
    { label: 'Contains text', icon: 'Aa', operator: 'contains' },
];

export function FilterBuilder({ schema, onApply }: FilterBuilderProps) {
    const [savedFilters, setSavedFilters] = useState<{ name: string, conditions: FilterCondition[] }[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const getColumnType = useCallback((colName: string): string => {
        const col = schema?.columns.find(c => c.name === colName);
        if (!col) return 'string';
        const type = col.type.toLowerCase();
        if (type.includes('float') || type.includes('int') || type.includes('number')) return 'number';
        if (type.includes('bool')) return 'boolean';
        if (type.includes('date') || type.includes('time')) return 'date';
        return 'string';
    }, [schema]);

    const getColumnIcon = useCallback((colName: string) => {
        const type = getColumnType(colName);
        switch (type) {
            case 'number': return <Hash className="w-3 h-3" />;
            case 'boolean': return <ToggleLeft className="w-3 h-3" />;
            case 'date': return <Calendar className="w-3 h-3" />;
            default: return <Type className="w-3 h-3" />;
        }
    }, [getColumnType]);

    const [conditions, setConditions] = useState<FilterCondition[]>([]);

    const addCondition = useCallback((preset?: { operator: string, value?: string }) => {
        if (!schema?.columns.length) return;

        const defaultColName = schema.columns[0].name;
        const colType = getColumnType(defaultColName);
        let operator = preset?.operator || 'contains';

        // Map generic operators to type-specific ones
        if (operator === 'is_not_empty' && colType === 'number') operator = 'is_not_null';
        if (operator === 'is_empty' && colType === 'number') operator = 'is_null';
        if (operator === 'is_not_empty' && colType === 'date') operator = 'is_not_null';
        if (operator === 'is_empty' && colType === 'date') operator = 'is_null';

        // Ensure operator exists for the type, else use type's first operator
        const ops = OPERATORS[colType as keyof typeof OPERATORS] || OPERATORS.string;
        if (!ops.find(o => o.value === operator)) {
            operator = ops[0].value;
        }

        const newCondition: FilterCondition = {
            id: crypto.randomUUID(),
            column: defaultColName,
            operator: operator,
            value: preset?.value || '',
            logic: conditions.length > 0 ? 'AND' : undefined
        };
        setConditions(prev => [...prev, newCondition]);
        setIsExpanded(true);
    }, [schema, conditions.length, getColumnType]);

    const removeCondition = useCallback((id: string) => {
        setConditions(prev => {
            const newConditions = prev.filter(c => c.id !== id);
            // Reset logic for first condition
            if (newConditions.length > 0 && newConditions[0].logic) {
                newConditions[0] = { ...newConditions[0], logic: undefined };
            }
            return newConditions;
        });
    }, []);

    const clearAll = useCallback(() => {
        setConditions([]);
        setIsExpanded(false);
        onApply([]);
    }, [onApply]);

    const duplicateCondition = useCallback((condition: FilterCondition) => {
        const newCondition = { ...condition, id: crypto.randomUUID(), logic: 'AND' as const };
        setConditions(prev => [...prev, newCondition]);
    }, []);

    const updateCondition = useCallback((id: string, updates: Partial<FilterCondition>) => {
        setConditions(prev => prev.map(c => {
            if (c.id !== id) return c;
            const updated = { ...c, ...updates };
            // Reset operator when column changes
            if (updates.column && updates.column !== c.column) {
                const colType = getColumnType(updates.column);
                const ops = OPERATORS[colType as keyof typeof OPERATORS] || OPERATORS.string;
                updated.operator = ops[0].value;
                updated.value = '';
                updated.value2 = undefined;
            }
            return updated;
        }));
    }, []);

    const handleApply = useCallback(() => {
        onApply(conditions.filter(c => {
            // Skip empty value conditions for operators that need values
            const noValueOps = ['is_empty', 'is_not_empty', 'is_null', 'is_not_null', 'is_true', 'is_false', 'is_today', 'is_this_week', 'is_this_month'];
            if (noValueOps.includes(c.operator)) return true;
            return c.value.trim() !== '';
        }));
    }, [conditions, onApply]);

    const saveCurrentFilter = useCallback(() => {
        const name = prompt('Enter a name for this filter:');
        if (name && conditions.length > 0) {
            setSavedFilters(prev => [...prev, { name, conditions: [...conditions] }]);
        }
    }, [conditions]);

    const loadFilter = useCallback((filter: { name: string, conditions: FilterCondition[] }) => {
        setConditions(filter.conditions.map(c => ({ ...c, id: crypto.randomUUID() })));
        setIsExpanded(true);
    }, []);

    const needsSecondValue = (operator: string) => ['between', 'date_between'].includes(operator);
    const needsNoValue = (operator: string) => [
        'is_empty', 'is_not_empty', 'is_null', 'is_not_null',
        'is_true', 'is_false', 'is_today', 'is_this_week', 'is_this_month'
    ].includes(operator);

    if (!schema) return null;

    return (
        <div className="border-b border-border-subtle bg-surface-secondary">
            {/* Main Filter Bar */}
            <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => conditions.length > 0 ? setIsExpanded(!isExpanded) : addCondition()}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${conditions.length > 0
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                            : 'bg-surface-elevated text-text-secondary border border-border-subtle hover:bg-surface-hover hover:text-text-primary'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        {conditions.length > 0 ? (
                            <>
                                {conditions.length} Filter{conditions.length > 1 ? 's' : ''}
                                {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                            </>
                        ) : (
                            'Add Filter'
                        )}
                    </button>

                    {/* Quick Actions */}
                    {conditions.length > 0 && (
                        <div className="flex items-center gap-1 border-l border-border-subtle pl-3">
                            <button
                                onClick={() => addCondition()}
                                className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Add filter"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={saveCurrentFilter}
                                className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Save filter"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                            <button
                                onClick={clearAll}
                                className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Clear all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Quick Filter Presets */}
                    {conditions.length === 0 && (
                        <div className="flex items-center gap-1 border-l border-border-subtle pl-3">
                            <span className="text-xs text-text-muted mr-2">Quick:</span>
                            {QUICK_FILTERS.slice(0, 3).map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => addCondition({ operator: preset.operator, value: preset.value })}
                                    className="px-2 py-1 text-xs bg-surface-overlay text-text-secondary rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                                    title={preset.label}
                                >
                                    {preset.icon}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Apply Button */}
                {conditions.length > 0 && (
                    <Button
                        onClick={handleApply}
                        size="sm"
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    >
                        <Play className="w-3.5 h-3.5" />
                        Apply Filters
                    </Button>
                )}
            </div>

            {/* Expanded Filter Panel */}
            {isExpanded && conditions.length > 0 && (
                <div className="px-5 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {/* Saved Filters */}
                    {savedFilters.length > 0 && (
                        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                            <span className="text-xs text-text-muted">Saved:</span>
                            {savedFilters.map((f, i) => (
                                <button
                                    key={i}
                                    onClick={() => loadFilter(f)}
                                    className="px-2 py-1 text-xs bg-surface-elevated text-text-secondary rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Condition List */}
                    {conditions.map((c, index) => {
                        const colType = getColumnType(c.column);
                        const ops = OPERATORS[colType as keyof typeof OPERATORS] || OPERATORS.string;
                        const currentOp = ops.find(o => o.value === c.operator);

                        return (
                            <div
                                key={c.id}
                                className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-border-subtle animate-in fade-in slide-in-from-left-2 duration-200"
                            >
                                {/* Logic Selector (AND/OR) */}
                                {index > 0 && (
                                    <select
                                        value={c.logic || 'AND'}
                                        onChange={(e) => updateCondition(c.id, { logic: e.target.value as 'AND' | 'OR' })}
                                        className="w-16 px-2 py-1.5 text-xs font-medium text-text-secondary bg-surface-elevated border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                                    >
                                        <option value="AND">AND</option>
                                        <option value="OR">OR</option>
                                    </select>
                                )}
                                {index === 0 && (
                                    <span className="w-16 text-xs font-medium text-text-muted text-center">WHERE</span>
                                )}

                                {/* Column Selector */}
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                                        {getColumnIcon(c.column)}
                                    </div>
                                    <select
                                        value={c.column}
                                        onChange={(e) => updateCondition(c.id, { column: e.target.value })}
                                        className="pl-8 pr-8 py-2 text-sm bg-surface-elevated border border-border-medium rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 appearance-none cursor-pointer min-w-[140px]"
                                    >
                                        {schema.columns.map(col => (
                                            <option key={col.name} value={col.name}>{col.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                                </div>

                                {/* Operator Selector */}
                                <div className="relative">
                                    <select
                                        value={c.operator}
                                        onChange={(e) => updateCondition(c.id, { operator: e.target.value })}
                                        className="px-3 py-2 text-sm bg-surface-elevated border border-border-medium rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 appearance-none cursor-pointer min-w-[150px]"
                                    >
                                        {ops.map(op => (
                                            <option key={op.value} value={op.value}>
                                                {op.icon} {op.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                                </div>

                                {/* Value Input(s) */}
                                {!needsNoValue(c.operator) && (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type={colType === 'number' ? 'number' : colType === 'date' ? 'date' : 'text'}
                                            value={c.value}
                                            onChange={(e) => updateCondition(c.id, { value: e.target.value })}
                                            placeholder={c.operator === 'in_list' ? 'value1, value2, ...' : 'Enter value...'}
                                            className="flex-1 px-3 py-2 text-sm bg-surface-elevated border border-border-medium rounded-lg text-text-primary placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                                        />
                                        {needsSecondValue(c.operator) && (
                                            <>
                                                <span className="text-xs text-text-muted">to</span>
                                                <input
                                                    type={colType === 'number' ? 'number' : 'date'}
                                                    value={c.value2 || ''}
                                                    onChange={(e) => updateCondition(c.id, { value2: e.target.value })}
                                                    placeholder="End value..."
                                                    className="flex-1 px-3 py-2 text-sm bg-surface-elevated border border-border-medium rounded-lg text-text-primary placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Condition Actions */}
                                <div className="flex items-center gap-1 ml-2">
                                    <button
                                        onClick={() => duplicateCondition(c)}
                                        className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Duplicate"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => removeCondition(c.id)}
                                        className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Remove"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add More Button */}
                    <button
                        onClick={() => addCondition()}
                        className="w-full py-2 border-2 border-dashed border-border-medium rounded-xl text-sm text-text-muted hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add another condition
                    </button>
                </div>
            )}
        </div>
    );
}
