// src/types/data-lens.ts
// TypeScript types for the Data Lens data analysis tool

/** A single column definition within a loaded table */
export interface ColumnDefinition {
  name: string;
  /** Inferred SQL/Python type, e.g. 'TEXT', 'INTEGER', 'FLOAT' */
  type: string;
}

/** Schema information for a table loaded into the Data Lens worker */
export interface TableSchema {
  table_name: string;
  rows: number;
  columns: ColumnDefinition[];
}

/** Result returned after running a SQL query or Python script */
export interface QueryResult {
  success: boolean;
  /** Row data — each row is an object keyed by column name */
  data: Record<string, unknown>[];
  /** Ordered column names for display */
  columns: string[];
  rowCount?: number;
  /** Error message when success is false */
  error?: string;
  /** Informational message (e.g. for DDL/DML statements) */
  message?: string;
  /** True if the result should be rendered as a JSON tree, not a table */
  is_json?: boolean;
}

/** Supported file types that Data Lens can ingest */
export type DataLensFileType = 'csv' | 'json' | 'xlsx';

/** Payload sent to the worker for a file load action */
export interface LoadFilePayload {
  filename: string;
  content: Uint8Array;
  type: DataLensFileType;
}

/** Overall state shape managed by useDataLens */
export interface DataLensState {
  isReady: boolean;
  isProcessing: boolean;
  error: string | null;
  schemas: TableSchema[];
  queryResult: QueryResult | null;
}
