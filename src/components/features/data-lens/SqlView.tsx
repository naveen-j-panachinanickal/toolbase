"use client";

import React from "react";
import { LazyEditor as Editor } from "@/components/ui/LazyEditor";
import { Button } from "@/components/ui/Button";
import { Play, Database, FileSpreadsheet, HelpCircle, ChevronUp, ChevronDown, CheckCircle2, GripHorizontal } from "lucide-react";
import { useTheme } from "next-themes";
import { TableSchema } from "@/hooks/useDataLens";
import { HelpPanel } from "./HelpPanel";
import { DataTable } from "./DataTable";
import { useResizablePanel } from "@/hooks/useResizablePanel";

interface SqlViewProps {
    sqlQuery: string;
    setSqlQuery: (query: string) => void;
    onRunSql: () => void;
    isProcessing: boolean;
    schemas: TableSchema[];
    queryResult?: { data: any[]; columns: string[]; rowCount?: number } | null;
}

export function SqlView({ sqlQuery, setSqlQuery, onRunSql, isProcessing, schemas, queryResult }: SqlViewProps) {
    const [isHelpOpen, setIsHelpOpen] = React.useState(false);
    const [resultsPanelCollapsed, setResultsPanelCollapsed] = React.useState(false);
    const { ratio, isDragging, handleProps, containerRef } = useResizablePanel({ initialRatio: 0.45 });
    const { theme, resolvedTheme } = useTheme();

    // Transform query result data for the DataTable
    const resultTableData = React.useMemo(() => {
        if (!queryResult?.data?.length || !queryResult?.columns?.length) return [];
        if (!Array.isArray(queryResult.data[0])) return queryResult.data;
        return queryResult.data.map((row: any[]) => {
            const rowObj: Record<string, any> = {};
            queryResult.columns.forEach((col, idx) => { rowObj[col] = row[idx]; });
            return rowObj;
        });
    }, [queryResult]);

    const hasResults = resultTableData.length > 0;

    const sqlExamples = [
        {
            title: "1. Basic Exploration",
            description: "See the first few rows to understand the data structure.",
            code: "SELECT * FROM employees_200 LIMIT 10;"
        },
        {
            title: "2. Precision Filtering",
            description: "Find entries matching specific criteria (use single quotes for text).",
            code: "SELECT * FROM complex_employees \nWHERE personalInfo_contact_address_city = 'Hyderabad' \nAND performance_rating > 4.5;"
        },
        {
            title: "3. Summary & Insights",
            description: "Calculate totals or averages grouped by a category.",
            code: "SELECT Department, \n       COUNT(*) as Headcount, \n       AVG(Salary) as AvgSalary \nFROM employees_200 \nGROUP BY Department \nORDER BY AvgSalary DESC;"
        },
        {
            title: "4. Cross-File Analysis (Join)",
            description: "Combine data from two different uploaded files.",
            code: "SELECT a.FirstName, a.Email, b.projects_name \nFROM employees_200 a \nJOIN complex_employees b ON a.EmployeeID = b.employeeId;"
        }
    ];

    const sqlIntro = (
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-primary">How Naming Works</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
                When you upload a file, the **filename (without extension)** becomes your table name.
            </p>
            <div className="flex items-center gap-3 bg-surface-sunken p-2 rounded-xl border border-border-subtle italic text-[10px] text-primary">
                <span>📄 employees_200.csv</span>
                <span className="text-text-muted">➔</span>
                <span className="font-mono font-bold">employees_200</span>
            </div>
            <p className="text-[10px] text-text-muted">
                All nested JSON fields are flattened using underscores (e.g., <code className="bg-primary/20 text-primary px-1 rounded">personalInfo_city</code>).
            </p>
        </div>
    );

    // Keep schemas in a ref so the Monaco provider always has the latest data
    const schemasRef = React.useRef<TableSchema[]>(schemas);
    React.useEffect(() => {
        schemasRef.current = schemas;
    }, [schemas]);

    const handleEditorMount = (editor: unknown, monaco: any) => {
        // Register completion item provider for SQL
        monaco.languages.registerCompletionItemProvider('sql', {
            provideCompletionItems: (model: any, position: any) => {
                const suggestions: unknown[] = [];
                const currentSchemas = schemasRef.current;

                // 1. Table Names (from current schemas)
                currentSchemas.forEach(s => {
                    suggestions.push({
                        label: s.table_name,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: s.table_name,
                        detail: `Table (${s.rows} rows, ${s.columns.length} columns)`,
                        range: {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn: position.column - 1,
                            endColumn: position.column
                        }
                    });
                });

                // 2. Column Names (unique across all tables)
                const allCols = Array.from(new Set(currentSchemas.flatMap(s => s.columns.map(c => c.name))));
                allCols.forEach(col => {
                    suggestions.push({
                        label: col,
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: col,
                        detail: 'Column Name',
                        sortText: 'z' // Move to bottom to avoid cluttering variables
                    });
                });

                // 3. SQL Keywords & Snippets
                const keywords = [
                    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 
                    'JOIN', 'LEFT JOIN', 'INNER JOIN', 'ON', 'AS', 'AND', 'OR', 
                    'COUNT', 'AVG', 'SUM', 'MAX', 'MIN', 'CREATE TABLE', 'INSERT INTO',
                    'UPDATE', 'SET', 'DELETE', 'DROP TABLE', 'ALTER TABLE'
                ];
                
                keywords.forEach(kw => {
                    suggestions.push({
                        label: kw,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: kw,
                        detail: 'SQL Keyword'
                    });
                });

                // 4. Common Snippets
                suggestions.push(
                    {
                        label: 'SELECT * FROM',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'SELECT * FROM ${1:table_name} LIMIT 100;',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Basic selection snippet'
                    },
                    {
                        label: 'CREATE TABLE',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'CREATE TABLE ${1:new_table} AS\nSELECT * FROM ${2:old_table}\nWHERE ${3:condition};',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Create new table from selection'
                    }
                );

                return { suggestions };
            }
        });
    };

    return (
        <div ref={containerRef} className="h-full flex flex-col bg-background relative overflow-hidden">
            {/* Editor Panel */}
            <div
                className="flex flex-col bg-surface border-b border-border-subtle shadow-sm overflow-hidden"
                style={hasResults && !resultsPanelCollapsed ? { height: `${ratio * 100}%`, minHeight: 150 } : { flex: 1 }}
            >
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-surface-secondary">
                    <span className="text-sm font-semibold text-text-primary">SQL Editor</span>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => setIsHelpOpen(true)}
                            variant="outline" 
                            size="sm" 
                            className="gap-2 border-border-medium hover:bg-surface-overlay text-text-secondary hover:text-text-primary"
                        >
                            <HelpCircle className="w-4 h-4" /> How to use
                        </Button>
                        <Button 
                            onClick={onRunSql} 
                            disabled={isProcessing} 
                            size="sm" 
                            className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm"
                        >
                            <Play className="w-4 h-4" /> Run Query
                        </Button>
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    <Editor
                        height="100%"
                        defaultLanguage="sql"
                        value={sqlQuery}
                        onChange={(val) => setSqlQuery(val || '')}
                        onMount={handleEditorMount}
                        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs'}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            padding: { top: 16, bottom: 16 },
                            scrollBeyondLastLine: false,
                            lineNumbers: 'on',
                            renderLineHighlight: 'all',
                            suggestOnTriggerCharacters: true,
                            quickSuggestions: true,
                        }}
                    />
                </div>
            </div>

            {/* Drag Handle */}
            {hasResults && !resultsPanelCollapsed && (
                <div {...handleProps}>
                    <div className={`w-12 h-1 rounded-full transition-colors ${isDragging ? 'bg-primary' : 'bg-border-medium group-hover:bg-primary'}`} />
                </div>
            )}

            {/* Inline Results Panel */}
            {hasResults && (
                <div className={`flex flex-col bg-surface overflow-hidden ${resultsPanelCollapsed ? 'h-auto' : 'flex-1 min-h-[120px]'}`}>
                    {/* Results Header */}
                    <div className="flex items-center justify-between px-5 py-2.5 border-b border-border-subtle bg-surface-secondary">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-semibold text-text-primary">Results</span>
                            <span className="text-xs text-text-secondary font-mono bg-surface-overlay px-2 py-0.5 rounded-md">
                                {resultTableData.length} row{resultTableData.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <button
                            onClick={() => setResultsPanelCollapsed(!resultsPanelCollapsed)}
                            className="p-1.5 rounded-lg hover:bg-surface-overlay text-text-muted hover:text-text-primary transition-colors"
                            title={resultsPanelCollapsed ? 'Expand results' : 'Collapse results'}
                        >
                            {resultsPanelCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                    {/* Results Table */}
                    {!resultsPanelCollapsed && (
                        <div className="flex-1 min-h-0 overflow-auto">
                            <DataTable
                                data={resultTableData}
                                columns={queryResult?.columns || []}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Schema Explorer (shown when no results) */}
            {!hasResults && (
                <div className="h-40 bg-surface border-t border-border-subtle p-5 overflow-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-text-primary">Schema Explorer</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {schemas.map(s => (
                            <div key={s.table_name} className="bg-surface-secondary border border-border-medium rounded-xl p-4 min-w-[200px]">
                                <div className="font-semibold text-primary mb-2 flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    {s.table_name}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {s.columns.slice(0, 5).map(c => (
                                        <span key={c.name} className="px-2 py-0.5 bg-surface border border-border-medium rounded text-[10px] text-text-secondary font-medium">{c.name}</span>
                                    ))}
                                    {s.columns.length > 5 && <span className="px-2 py-0.5 text-[10px] text-text-muted">+{s.columns.length - 5}</span>}
                                </div>
                            </div>
                        ))}
                        {schemas.length === 0 && (
                            <p className="text-sm text-text-muted">No tables loaded yet. Upload a file to see schema.</p>
                        )}
                    </div>
                </div>
            )}

            <HelpPanel 
                isOpen={isHelpOpen} 
                onClose={() => setIsHelpOpen(false)} 
                title="SQL Help" 
                introduction={sqlIntro}
                examples={sqlExamples} 
            />
        </div>
    );
}
