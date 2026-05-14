"use client";

import React, { useEffect, useRef } from "react";
import { LazyEditor as Editor } from "@/components/ui/LazyEditor";
import { Button } from "@/components/ui/Button";
import { Play, HelpCircle, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { TableSchema } from "@/hooks/useDataLens";
import { HelpPanel } from "./HelpPanel";
import { DataTable } from "./DataTable";
import { useResizablePanel } from "@/hooks/useResizablePanel";

interface PythonViewProps {
    pythonCode: string;
    setPythonCode: (code: string) => void;
    onRunPython: () => void;
    isProcessing: boolean;
    schemas: TableSchema[];
    queryResult?: { data: any[]; columns: string[]; rowCount?: number } | null;
}

export function PythonView({ pythonCode, setPythonCode, onRunPython, isProcessing, schemas, queryResult }: PythonViewProps) {
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

    const pythonExamples = [
        {
            title: "1. Instant Preview",
            description: "Check the top rows of an uploaded file using its filename.",
            code: "result = employees_200.head(10)"
        },
        {
            title: "2. Pandas Filtering",
            description: "Use standard Pandas syntax to slice your data.",
            code: "high_earners = employees_200[employees_200['Salary'] > 120000]\nresult = high_earners[['FirstName', 'LastName', 'Salary']]"
        },
        {
            title: "3. Smart Output Detection",
            description: "No need to set 'result = '. The engine automatically finds new DataFrames!",
            code: "df = employees_200.copy()\ndf['Full_Name'] = df['FirstName'] + ' ' + df['LastName']\n# DataLens will automatically show 'df'!"
        },
        {
            title: "4. Merging Multiple Files",
            description: "Join CSV and JSON data effortlessly.",
            code: "result = pd.merge(\n    employees_200, \n    complex_employees, \n    left_on='EmployeeID', \n    right_on='employeeId'\n)"
        },
        {
            title: "5. Complex Aggregation",
            description: "Calculate multi-column statistics and sort.",
            code: "stats = employees_200.groupby('Department').agg({\n    'Salary': ['mean', 'max'],\n    'EmployeeID': 'count'\n})\nresult = stats.sort_values(('Salary', 'mean'), ascending=False)"
        }
    ];

    const pythonIntro = (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-text-primary">Variables & Naming</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                    Every file you upload is automatically injected as a **Pandas DataFrame** variable. 
                </p>
                <div className="flex items-center gap-3 bg-surface-sunken p-2 rounded-xl border border-border-subtle italic text-[10px] text-primary">
                    <span>📄 employees_200.csv</span>
                    <span className="text-text-muted">➔</span>
                    <span className="font-mono font-bold">employees_200</span>
                </div>
            </div>
            
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-text-primary">Python Environment</h3>
                <ul className="text-[10px] text-text-secondary space-y-1 list-disc pl-4">
                    <li>Built-in: <code className="bg-primary/20 px-1 rounded text-primary">pd</code> (Pandas), <code className="bg-primary/20 px-1 rounded text-primary">np</code> (NumPy)</li>
                    <li>Automatic Result: The last created DataFrame is auto-detected.</li>
                    <li>Nested JSON: Arrays are automatically &quot;exploded&quot; into rows.</li>
                </ul>
            </div>
        </div>
    );

    // Keep schemas in a ref so the Monaco provider always has the latest data
    const schemasRef = useRef<TableSchema[]>(schemas);
    useEffect(() => {
        schemasRef.current = schemas;
    }, [schemas]);

    const handleEditorMount = (editor: unknown, monaco: any) => {
        // Register completion item provider for Python
        monaco.languages.registerCompletionItemProvider('python', {
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
                        sortText: 'z'
                    });
                });

                // 3. Pandas Boilerplate Snippets
                suggestions.push(
                    {
                        label: 'pd.read_csv',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: "pd.read_csv('${1:filename}.csv')",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Load CSV into DataFrame'
                    },
                    {
                        label: 'groupby',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: "groupby('${1:column}').agg({'${2:col}': '${3:sum}'})",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Group by and aggregate'
                    },
                    {
                        label: 'pd.to_datetime',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: "pd.to_datetime(${1:df}['${2:column}'])",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Convert column to datetime'
                    },
                    {
                        label: 'describe',
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertText: 'describe()',
                        detail: 'Get table statistics'
                    },
                    {
                        label: 'pivot_table',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: "pivot_table(index='${1:col1}', columns='${2:col2}', values='${3:col3}', aggfunc='${4:sum}')",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Create a pivot table'
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
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-text-primary">Python Editor</span>
                        <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-[10px] text-yellow-600 font-medium">Pyodide WASM</span>
                    </div>
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
                            onClick={onRunPython} 
                            disabled={isProcessing} 
                            size="sm" 
                            className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm"
                        >
                            <Play className="w-4 h-4" /> Run Script
                        </Button>
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    <Editor
                        height="100%"
                        defaultLanguage="python"
                        value={pythonCode}
                        onChange={(val) => setPythonCode(val || '')}
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
                            wordBasedSuggestions: "off",
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

            {/* Environment Info (shown when no results) */}
            {!hasResults && (
                <div className="h-36 grid grid-cols-2 gap-4 p-4 border-t border-border-subtle bg-surface">
                    <div className="bg-surface-secondary rounded-2xl border border-border-medium p-4">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Available Libraries</h5>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400 font-medium">pandas (pd)</span>
                            <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-400 font-medium">numpy (np)</span>
                            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400 font-medium">openpyxl</span>
                        </div>
                    </div>
                    <div className="bg-surface-secondary rounded-2xl border border-border-medium p-4 overflow-auto">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Available Variables</h5>
                        <div className="text-xs text-text-primary space-y-1.5">
                            <div className="flex items-center gap-2">
                                <code className="text-primary font-semibold">DATA_STORE</code>
                                <span className="text-text-secondary">— All loaded DataFrames</span>
                            </div>
                            {schemas.map(s => (
                                <div key={s.table_name} className="flex items-center gap-2">
                                    <code className="text-primary font-semibold">{s.table_name}</code>
                                    <span className="text-text-secondary">— {s.rows} rows</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <HelpPanel 
                isOpen={isHelpOpen} 
                onClose={() => setIsHelpOpen(false)} 
                title="Python Help" 
                introduction={pythonIntro}
                examples={pythonExamples} 
            />
        </div>
    );
}
