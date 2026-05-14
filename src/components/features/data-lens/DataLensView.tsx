"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useDataLens } from "@/hooks/useDataLens";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";
import {
    LayoutGrid, Braces, Code2, Terminal, BarChart3, Upload,
    Loader2, FileText, FileJson, AlertCircle, X,
    ScanSearch, PanelLeft, PanelLeftClose, Database, FileSpreadsheet, Trash2, Info, Plus
} from "lucide-react";
import Image from "next/image";

const JsonTreeViewer = dynamic(() => import("./JsonTreeViewer").then(mod => mod.JsonTreeViewer), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const ChartBuilder = dynamic(() => import("./ChartBuilder").then(mod => mod.ChartBuilder), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const SqlView = dynamic(() => import("./SqlView").then(mod => mod.SqlView), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const PythonView = dynamic(() => import("./PythonView").then(mod => mod.PythonView), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const DataView = dynamic(() => import("./DataView").then(mod => mod.DataView), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });

// ============================================================================
// MAIN DATALENS VIEW - WHITE THEME
// ============================================================================

export default function DataLensView() {
    const { isReady, isProcessing, error, schemas, queryResult, tableResult, loadFile, runSql, runPython, deleteTable, clearAllTables, clearQueryResult, getRawJson, selectTableData } = useDataLens();
    const [activeTab, setActiveTab] = useState<"data" | "results" | "json" | "sql" | "python" | "charts">("data");
    const [chartDataSource, setChartDataSource] = useState<"table" | "results">("table");
    const [sqlQuery, setSqlQuery] = useState("SELECT * FROM table_name LIMIT 100;");
    const [pythonCode, setPythonCode] = useState(`# Available: pd (pandas), np (numpy)
# All loaded tables are available as variables
# Assign your output to 'result'

result = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})`);
    const [activeTable, setActiveTable] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [rawJsonData, setRawJsonData] = useState<any>(null);
    const [jsonLoading, setJsonLoading] = useState(false);
    const activeSchema = schemas.find(s => s.table_name === activeTable);

    // Load raw JSON when switching to JSON view and we have an active table
    useEffect(() => {
        if (activeTab === 'json' && activeTable && !rawJsonData) {
            setJsonLoading(true);
            getRawJson(activeTable)
                .then(res => {
                    if (res.success) {
                        setRawJsonData(res.data);
                    }
                })
                .finally(() => setJsonLoading(false));
        }
    }, [activeTab, activeTable, rawJsonData, getRawJson]);

    // Clear JSON data when table changes
    useEffect(() => {
        setRawJsonData(null);
    }, [activeTable]);

    // Transform data for table
    const showResults = activeTab === 'results' || (activeTab === 'charts' && chartDataSource === 'results');
    const currentData = showResults ? (queryResult?.data || []) : (tableResult?.data || []);
    const currentColumns = showResults ? (queryResult?.columns || []) : (tableResult?.columns || []);
    const tableData = useMemo(() => {
        if (!currentData.length || !currentColumns.length) return [];
        if (!Array.isArray(currentData[0])) return currentData;
        return currentData.map((row: any[]) => {
            const rowObj: Record<string, any> = {};
            currentColumns.forEach((col, idx) => { rowObj[col] = row[idx]; });
            return rowObj;
        });
    }, [currentData, currentColumns]);

    const handleFileUpload = useCallback(async (files: File[]) => {
        const fileList = files.slice(0, 10);
        if (fileList.length > 0) {
            try {
                let lastTableName = '';
                for (const file of fileList) {
                    const res = await loadFile(file);
                    if (res?.success && res.table_name) {
                        lastTableName = res.table_name;
                    }
                }

                if (lastTableName) {
                    setActiveTable(lastTableName);
                    const sql = `SELECT * FROM "${lastTableName}" LIMIT 100`;
                    setSqlQuery(sql);
                    await selectTableData(lastTableName);
                    setActiveTab('data');
                }
            } catch (e) {
                console.error('DataLensView: handleFileUpload error:', e);
            }
        }
    }, [loadFile, selectTableData]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(Array.from(files));
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    }, [handleFileUpload]);

    const handleRunSql = useCallback(async () => {
        await runSql(sqlQuery);
    }, [runSql, sqlQuery]);

    const handleRunPython = useCallback(async () => {
        await runPython(pythonCode);
    }, [runPython, pythonCode]);

    const handleExport = useCallback((format: 'csv' | 'json') => {
        if (!currentData.length) return;
        let content: string;
        let mimeType: string;
        let extension: string;

        if (format === 'json') {
            content = JSON.stringify(tableData, null, 2);
            mimeType = 'application/json';
            extension = 'json';
        } else {
            content = [
                currentColumns.join(","),
                ...currentData.map(row =>
                    Array.isArray(row)
                        ? row.map(c => JSON.stringify(c)).join(",")
                        : currentColumns.map(col => JSON.stringify(row[col])).join(",")
                )
            ].join("\n");
            mimeType = 'text/csv;charset=utf-8;';
            extension = 'csv';
        }

        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${activeTable || 'export'}.${extension}`;
        link.click();
    }, [currentData, currentColumns, tableData, activeTable]);

    const handleApplyFilters = useCallback(async (conditions: any[]) => {
        if (!activeTable) return;
        let query = `SELECT * FROM "${activeTable}"`;

        if (conditions.length > 0) {
            const clauses: string[] = [];
            conditions.forEach((c, i) => {
                const val = c.value.replace(/'/g, "''");
                let clause = '';

                switch (c.operator) {
                    // String operators
                    case 'contains': clause = `"${c.column}" LIKE '%${val}%'`; break;
                    case 'not_contains': clause = `"${c.column}" NOT LIKE '%${val}%'`; break;
                    case 'equals': clause = `"${c.column}" = '${val}'`; break;
                    case 'not_equals': clause = `"${c.column}" != '${val}'`; break;
                    case 'startswith': clause = `"${c.column}" LIKE '${val}%'`; break;
                    case 'endswith': clause = `"${c.column}" LIKE '%${val}'`; break;
                    case 'is_empty': clause = `("${c.column}" IS NULL OR "${c.column}" = '')`; break;
                    case 'is_not_empty': clause = `("${c.column}" IS NOT NULL AND "${c.column}" != '')`; break;
                    case 'regex': clause = `"${c.column}" REGEXP '${val}'`; break;
                    case 'in_list':
                        const items = val.split(',').map((v: string) => `'${v.trim()}'`).join(', ');
                        clause = `"${c.column}" IN (${items})`; break;
                    // Number operators
                    case 'eq': clause = `"${c.column}" = ${val}`; break;
                    case 'neq': clause = `"${c.column}" != ${val}`; break;
                    case 'gt': clause = `"${c.column}" > ${val}`; break;
                    case 'lt': clause = `"${c.column}" < ${val}`; break;
                    case 'gte': clause = `"${c.column}" >= ${val}`; break;
                    case 'lte': clause = `"${c.column}" <= ${val}`; break;
                    case 'between': clause = `"${c.column}" BETWEEN ${val} AND ${c.value2 || val}`; break;
                    case 'is_null': clause = `"${c.column}" IS NULL`; break;
                    case 'is_not_null': clause = `"${c.column}" IS NOT NULL`; break;
                    // Boolean operators
                    case 'is_true': clause = `"${c.column}" = 1`; break;
                    case 'is_false': clause = `"${c.column}" = 0`; break;
                    // Date operators
                    case 'date_eq': clause = `DATE("${c.column}") = '${val}'`; break;
                    case 'date_before': clause = `DATE("${c.column}") < '${val}'`; break;
                    case 'date_after': clause = `DATE("${c.column}") > '${val}'`; break;
                    case 'date_between': clause = `DATE("${c.column}") BETWEEN '${val}' AND '${c.value2 || val}'`; break;
                    default: clause = `"${c.column}" = '${val}'`;
                }

                if (i === 0) {
                    clauses.push(clause);
                } else {
                    clauses.push(`${c.logic || 'AND'} ${clause}`);
                }
            });
            query += ` WHERE ${clauses.join(' ')}`;
        }
        query += ` LIMIT 1000`;

        setSqlQuery(query);
        await runSql(query);
        setActiveTab('results');
    }, [activeTable, runSql]);

    const selectTable = useCallback(async (tableName: string) => {
        setActiveTable(tableName);
        await selectTableData(tableName);
        setActiveTab('data');
    }, [selectTableData]);

    const handleDeleteTable = useCallback(async (tableName: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent selecting the table when clicking delete

        if (!confirm(`Are you sure you want to delete "${tableName}"? This cannot be undone.`)) {
            return;
        }

        try {
            await deleteTable(tableName);
            // If we deleted the active table, clear the view
            if (activeTable === tableName) {
                setActiveTable(null);
                clearQueryResult(); // Clear the table data
                setSqlQuery('SELECT * FROM table_name LIMIT 100;');
            }
        } catch (err) {
            console.error('Failed to delete table:', err);
        }
    }, [deleteTable, activeTable, clearQueryResult]);

    // Loading State
    if (!isReady) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
                            <Image className="w-full h-full object-contain" src="/assets/thumbnails/data-lens.png" alt="DataLens" width={40} height={40} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Initializing DataLens</h2>
                        <p className="text-text-muted">Loading Python runtime & dependencies...</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">This may take a moment</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface text-text-primary">
            <div className="flex h-screen">
                {/* SIDEBAR */}
                <aside className={`flex flex-col border-r border-border-subtle bg-surface-overlay backdrop-blur-sm transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-72'}`}>
                    {/* Logo */}
                    <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/10 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <ScanSearch className="w-5 h-5 text-white relative z-10" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg text-text-primary">DataLens</h1>
                                    <p className="text-[10px] text-text-muted -mt-0.5">In-Browser Analytics</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                        >
                            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Tables Section */}
                    <div className="flex-1 overflow-auto p-4">
                        {!sidebarCollapsed && (
                            <div className="flex items-center justify-between mb-3 group/header">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tables</span>
                                    <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">{schemas.length}</span>
                                </div>
                                {schemas.length > 0 && (
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        size="md"
                                        variant="outline"
                                        className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 text-[10px] h-7 px-2 font-bold"
                                        title="Import more files (max 10)"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Import Files
                                    </Button>
                                )}
                            </div>
                        )}

                        {schemas.length === 0 ? (
                            !sidebarCollapsed && (
                                <div className="text-center py-8 px-4 text-text-muted">
                                    <Database className="w-10 h-10 mx-auto mb-3 opacity-30 text-text-muted" />
                                    <p className="text-sm font-medium text-text-secondary">No tables yet</p>
                                    <p className="text-xs mt-1 mb-6">Upload a file to get started</p>
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        size="sm"
                                        className="w-full gap-2 bg-primary hover:bg-primary/90 text-white shadow-md active:scale-95 transition-transform border-0"
                                    >
                                        <Upload className="w-4 h-4" /> Import File
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="space-y-1.5">
                                {schemas.map(s => (
                                    <div
                                        key={s.table_name}
                                        onClick={() => selectTable(s.table_name)}
                                        className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${activeTable === s.table_name
                                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                            }`}
                                    >
                                        <FileSpreadsheet className={`w-4 h-4 shrink-0 ${activeTable === s.table_name ? 'text-primary' : 'text-text-muted'}`} />
                                        {!sidebarCollapsed && (
                                            <>
                                                <span className="truncate flex-1 text-left font-medium">{s.table_name}</span>
                                                <span className="text-[10px] text-text-muted font-mono bg-surface-secondary px-1.5 py-0.5 rounded group-hover:hidden">{s.rows}</span>
                                                <button
                                                    onClick={(e) => handleDeleteTable(s.table_name, e)}
                                                    className="hidden group-hover:flex items-center justify-center p-1 rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                    title="Delete table"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Help Area */}
                    {!sidebarCollapsed && (
                        <div className="p-4 border-t border-border-subtle flex flex-col gap-3">
                            {schemas.length > 0 && (
                                <Button
                                    onClick={clearAllTables}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs font-medium px-3 py-2 rounded-xl active:scale-95 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" /> Clear All Data
                                </Button>
                            )}
                            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                    <div className="text-xs text-text-secondary">
                                        <p className="font-medium text-text-primary mb-1">Pro Tip</p>
                                        <p>All processing happens locally in your browser. Your data never leaves your device.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 flex flex-col overflow-hidden bg-surface">
                    {/* Top Bar */}
                    <header className="px-6 py-4 border-b border-border-subtle bg-surface-overlay backdrop-blur-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 p-1 bg-surface-secondary rounded-xl border border-border-subtle">
                            {[
                                { id: 'data', icon: LayoutGrid, label: 'Table' },
                                { id: 'results', icon: Database, label: 'Results' },
                                { id: 'json', icon: Braces, label: 'JSON' },
                                { id: 'sql', icon: Code2, label: 'SQL Query' },
                                { id: 'python', icon: Terminal, label: 'Python' },
                                { id: 'charts', icon: BarChart3, label: 'Charts' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-surface-elevated text-primary shadow-sm border border-border-subtle'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.json,.xlsx"
                                onChange={handleFileInputChange}
                                multiple
                                className="hidden"
                            />

                            {isProcessing && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium animate-pulse">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </div>
                            )}
                            {tableData.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleExport('csv')}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/30 backdrop-blur-sm transition-all font-semibold shadow-xs"
                                    >
                                        <FileText className="w-4 h-4" /> Export as CSV
                                    </Button>
                                    <Button
                                        onClick={() => handleExport('json')}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/30 backdrop-blur-sm transition-all font-semibold shadow-xs"
                                    >
                                        <FileJson className="w-4 h-4" /> Export as JSON
                                    </Button>
                                </div>
                            )}
                            <ReturnToToolsButton />
                        </div>
                    </header>

                    {/* Error Banner */}
                    {error && (
                        <div className="mx-6 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div>
                                <strong>Error:</strong> {error}
                            </div>
                            <button className="ml-auto p-1 text-red-400 hover:text-red-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'results' && (
                            <div className="h-full flex flex-col bg-surface">
                                <DataView
                                    tableData={tableData}
                                    currentColumns={currentColumns}
                                    activeSchema={undefined} // No schema for results
                                    onApplyFilters={() => { }} // No filters for results
                                    onSwitchToSql={() => setActiveTab('sql')}
                                    onSwitchToPython={() => setActiveTab('python')}
                                    title="Query Result"
                                />
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <div className="h-full flex flex-col bg-surface">
                                <DataView
                                    tableData={tableData}
                                    currentColumns={currentColumns}
                                    activeSchema={activeSchema}
                                    onApplyFilters={handleApplyFilters}
                                    onSwitchToSql={() => setActiveTab('sql')}
                                    onSwitchToPython={() => setActiveTab('python')}
                                />
                            </div>
                        )}

                        {activeTab === 'json' && (
                            <div className="h-full flex flex-col bg-surface">
                                {jsonLoading ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <span className="ml-3 text-text-muted">Loading JSON data...</span>
                                    </div>
                                ) : rawJsonData ? (
                                    <JsonTreeViewer data={rawJsonData} />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center bg-surface-secondary">
                                        <div className="w-32 h-32 rounded-3xl bg-surface-elevated border border-border-medium shadow-xl flex items-center justify-center mb-8">
                                            <Braces className="w-16 h-16 text-text-faint" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-text-primary mb-2">JSON Explorer</h3>
                                        <p className="text-text-muted max-w-md text-center mb-8">
                                            {activeTable
                                                ? "This table doesn't have raw JSON data. Import a JSON file to use this view."
                                                : "Select a JSON table from the sidebar to explore its structure."
                                            }
                                        </p>
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="gap-2 bg-primary hover:bg-primary/90 text-white border-0"
                                        >
                                            <Upload className="w-5 h-5" /> Import JSON File
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'sql' && (
                            <SqlView
                                sqlQuery={sqlQuery}
                                setSqlQuery={setSqlQuery}
                                onRunSql={handleRunSql}
                                isProcessing={isProcessing}
                                schemas={schemas}
                                queryResult={queryResult}
                            />
                        )}

                        {activeTab === 'python' && (
                            <PythonView
                                pythonCode={pythonCode}
                                setPythonCode={setPythonCode}
                                onRunPython={handleRunPython}
                                isProcessing={isProcessing}
                                schemas={schemas}
                                queryResult={queryResult}
                            />
                        )}

                        {activeTab === 'charts' && (
                            <div className="h-full flex flex-col bg-surface">
                                <div className="px-6 py-3 border-b border-border-subtle flex items-center justify-between bg-surface shadow-xs z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <BarChart3 className="w-4 h-4 text-primary" />
                                        </div>
                                        <h3 className="font-bold text-text-primary text-sm">Chart Builder</h3>
                                    </div>
                                    <div className="flex items-center gap-1 p-1 bg-surface-secondary rounded-xl border border-border-subtle backdrop-blur-sm">
                                        <button
                                            onClick={() => setChartDataSource('table')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${chartDataSource === 'table'
                                                ? 'bg-surface-elevated text-primary shadow-sm border border-border-subtle'
                                                : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            Raw Table
                                        </button>
                                        <button
                                            onClick={() => setChartDataSource('results')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${chartDataSource === 'results'
                                                ? 'bg-surface-elevated text-primary shadow-sm border border-border-subtle'
                                                : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            Query Results
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <ChartBuilder data={tableData} columns={currentColumns} />
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
