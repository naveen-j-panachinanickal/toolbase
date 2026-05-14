import { useState, useEffect, useRef, useCallback } from 'react';
import { createTimer } from '@/shared/lib/performance';

export interface EtlState {
    isReady: boolean;
    isProcessing: boolean;
    error: string | null;
    schemas: TableSchema[];
    queryResult: QueryResult | null;
    tableResult: QueryResult | null;
}

export interface TableSchema {
    table_name: string;
    rows: number;
    columns: { name: string, type: string }[];
}

export interface QueryResult {
    success: boolean;
    data: any[];
    columns: string[];
    rowCount?: number;
    error?: string;
    message?: string;
}

/**
 * The interface for the Data Lens hook, providing methods for ETL and data analysis.
 */
export interface UseDataLensResult extends EtlState {
    /**
     * Loads a file into the in-memory database.
     * Supports CSV, JSON, and XLSX.
     * 
     * @param file - The browser File object to ingest.
     * @returns A promise resolving to the ingestion result.
     */
    loadFile: (file: File) => Promise<any>;
    /**
     * Executes a SQL query against the loaded tables (DuckDB-WASM).
     * 
     * @param query - The SQL string to execute.
     * @returns A promise resolving to the query result.
     */
    runSql: (query: string) => Promise<any>;
    /**
     * Executes Python code against the data (Pyodide).
     * 
     * @param code - The Python script to execute.
     * @returns A promise resolving to the execution result.
     */
    runPython: (code: string) => Promise<any>;
    /** Refreshes the list of available table schemas from the worker. */
    refreshSchemas: () => Promise<any>;
    /** Deletes a specific table from the in-memory store. */
    deleteTable: (tableName: string) => Promise<any>;
    /** Clears all tables and results from the workspace. */
    clearAllTables: () => Promise<void>;
    /** Clears the current SQL/Python query result from the state. */
    clearQueryResult: () => void;
    /** Retrieves the raw JSON representation of a table. */
    getRawJson: (tableName: string) => Promise<any>;
    /** Executes a JSON query (e.g., JMESPath) against a table. */
    queryJson: (tableName: string, query: string) => Promise<any>;
    /** Convenience method to select all data from a table (capped at 1000 rows). */
    selectTableData: (tableName: string) => Promise<any>;
}

/**
 * A React hook that manages a persistent background worker for data analysis.
 * 
 * It coordinates a singleton worker instance that runs DuckDB and Pyodide,
 * allowing for high-performance data processing (SQL, Python, JSON) 
 * directly in the browser without server round-trips.
 *
 * @returns {UseDataLensResult} State and methods for interacting with the data engine.
 */
export function useDataLens(): UseDataLensResult {
    const [isReady, setIsReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [schemas, setSchemas] = useState<TableSchema[]>([]);
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
    const [tableResult, setTableResult] = useState<QueryResult | null>(null);

    // Initial load
    useEffect(() => {
        const { ready } = getDataLensWorker();
        ready?.then(() => {
            setIsReady(true);
            refreshSchemas();
        }).catch(err => {
            console.error("Worker initialization failed", err);
            setError("Worker initialization failed");
        });
    }, []);

    const sendMessage = useCallback((action: string, data: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            const { worker } = getDataLensWorker();
            if (!worker) {
                reject(new Error("Worker not initialized"));
                return;
            }

            const timer = createTimer();
            timer.start();

            setIsProcessing(true);
            setError(null);

            const messageId = Math.random().toString(36).substring(7);

            const handleMessage = (event: MessageEvent) => {
                const { type, id, data: resultData, error } = event.data;
                if (id === messageId) {
                    worker.removeEventListener('message', handleMessage);
                    
                    timer.stop('data-lens');
                    
                    setIsProcessing(false);
                    if (type === 'ERROR') {
                        setError(error);
                        reject(new Error(error));
                    } else {
                        resolve(resultData);
                    }
                }
            };

            worker.addEventListener('message', handleMessage);
            worker.postMessage({ type: 'EXECUTE', action, data, id: messageId });
        });
    }, []);

    const loadFile = useCallback(async (file: File) => {
        try {
            const buffer = await file.arrayBuffer();
            const content = new Uint8Array(buffer);
            const type = file.name.endsWith('.csv') ? 'csv' :
                file.name.endsWith('.json') ? 'json' :
                    file.name.endsWith('.xlsx') ? 'xlsx' : 'unknown';

            if (type === 'unknown') {
                throw new Error("Unsupported file type");
            }

            const res = await sendMessage('load_file', {
                filename: file.name,
                content: content,
                type
            });

            if (res.success) {
                const schemaRes = await sendMessage('get_schemas', {});
                if (schemaRes.success) {
                    setSchemas(schemaRes.schemas);
                }
                return res;
            } else {
                throw new Error(res.error || "Failed to load file");
            }
        } catch (err: any) {
            setError(err.message);
            setIsProcessing(false);
            throw err;
        }
    }, [sendMessage]);

    const runSql = useCallback(async (query: string) => {
        try {
            const res = await sendMessage('run_sql', { query });
            if (res && res.success) {
                setQueryResult(res);
                if (res.schemas_updated) {
                    await refreshSchemas();
                }
            } else {
                setError(res?.error || 'Unknown error');
            }
            return res;
        } catch (err: any) {
            console.error('Hook: runSql exception:', err);
            setError(err.message);
        }
    }, [sendMessage]);

    const runPython = useCallback(async (code: string) => {
        try {
            const res = await sendMessage('run_python', { code });
            if (res.success) {
                setQueryResult(res);
            } else {
                setError(res.error);
            }
            return res;
        } catch (err: any) {
            setError(err.message);
        }
    }, [sendMessage]);

    const refreshSchemas = useCallback(async () => {
        try {
            const res = await sendMessage('get_schemas', {});
            if (res.success) {
                setSchemas(res.schemas);
                return res.schemas;
            }
        } catch (err: any) {
            console.error(err);
        }
    }, [sendMessage]);

    const deleteTable = useCallback(async (tableName: string) => {
        try {
            const res = await sendMessage('delete_table', { table_name: tableName });
            if (res.success) {
                const schemaRes = await sendMessage('get_schemas', {});
                if (schemaRes.success) {
                    setSchemas(schemaRes.schemas);
                }
                return res;
            } else {
                throw new Error(res.error || "Failed to delete table");
            }
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [sendMessage]);

    const clearAllTables = useCallback(async () => {
        setIsProcessing(true);
        try {
            await sendMessage('clear_all', {});
            setSchemas([]);
            setTableResult(null);
            setQueryResult(null);
        } catch (err: any) {
            setError(err.message || 'Failed to clear tables');
        } finally {
            setIsProcessing(false);
        }
    }, [sendMessage]);

    const clearQueryResult = useCallback(() => {
        setQueryResult(null);
    }, []);

    const getRawJson = useCallback(async (tableName: string) => {
        try {
            const res = await sendMessage('get_raw_json', { table_name: tableName });
            return res;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [sendMessage]);

    const queryJson = useCallback(async (tableName: string, query: string) => {
        try {
            const res = await sendMessage('query_json', { table_name: tableName, query });
            if (res.success && !res.is_json) {
                setQueryResult(res);
            }
            return res;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [sendMessage]);

    const selectTableData = useCallback(async (tableName: string) => {
        try {
            const res = await sendMessage('run_sql', { query: `SELECT * FROM "${tableName}" LIMIT 1000` });
            if (res.success) {
                setTableResult(res);
            } else {
                setError(res.error);
            }
            return res;
        } catch (err: any) {
            setError(err.message);
        }
    }, [sendMessage]);

    return {
        isReady,
        isProcessing,
        error,
        schemas,
        queryResult,
        tableResult,
        loadFile,
        runSql,
        runPython,
        refreshSchemas,
        deleteTable,
        clearAllTables,
        clearQueryResult,
        getRawJson,
        queryJson,
        selectTableData
    };
}
