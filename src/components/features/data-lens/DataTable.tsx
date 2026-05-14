"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
    useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
    getSortedRowModel, flexRender, SortingState, VisibilityState
} from "@tanstack/react-table";
import {
    Search, Table as TableIcon, Columns3, X, Settings2,
    ChevronLeft, ChevronRight, SortAsc, SortDesc, Check, Copy
} from "lucide-react";

interface DataTableProps {
    data: Record<string, unknown>[];
    columns: string[];
}

export function DataTable({ data, columns }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    const [copiedCell, setCopiedCell] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState(50);

    const tableColumns = useMemo(() => {
        return columns.map(col => ({
            accessorKey: col,
            header: col,
            enableHiding: true,
        }));
    }, [columns]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        state: { sorting, globalFilter, columnVisibility },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize } },
    });

    const copyToClipboard = useCallback((value: string, cellId: string) => {
        navigator.clipboard.writeText(value);
        setCopiedCell(cellId);
        setTimeout(() => setCopiedCell(null), 1500);
    }, []);

    const pageInfo = table.getState().pagination;
    const totalPages = table.getPageCount();
    const visibleColumns = table.getVisibleLeafColumns().length;

    return (
        <div className="flex flex-col h-full bg-surface">
            {/* Table Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-surface-secondary">
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            value={globalFilter ?? ''}
                            onChange={e => setGlobalFilter(e.target.value)}
                            className="w-72 pl-10 pr-10 py-2.5 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-text-primary placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 shadow-sm transition-all"
                            placeholder="Search all columns..."
                        />
                        {globalFilter && (
                            <button
                                onClick={() => setGlobalFilter('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span className="flex items-center gap-1.5">
                            <TableIcon className="w-3.5 h-3.5" />
                            <span className="font-semibold text-primary">{table.getFilteredRowModel().rows.length}</span> rows
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Columns3 className="w-3.5 h-3.5" />
                            <span className="font-semibold text-primary">{visibleColumns}</span> columns
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Column Visibility */}
                    <div className="relative">
                        <button
                            onClick={() => setShowColumnSettings(!showColumnSettings)}
                            className={`p-2 rounded-lg border transition-all ${showColumnSettings ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface border-border-subtle text-text-muted hover:text-text-primary'}`}
                            title="Column settings"
                        >
                            <Settings2 className="w-4 h-4" />
                        </button>

                        {showColumnSettings && (
                            <div className="absolute right-0 top-full mt-2 w-64 max-h-80 overflow-auto bg-surface-elevated border border-border-medium rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="p-3 border-b border-border-subtle flex justify-between items-center bg-surface-secondary">
                                    <span className="text-sm font-semibold text-text-primary">Columns</span>
                                    <button
                                        onClick={() => table.toggleAllColumnsVisible(true)}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Show all
                                    </button>
                                </div>
                                <div className="p-2">
                                    {table.getAllLeafColumns().map(column => (
                                        <label
                                            key={column.id}
                                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-hover cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={column.getIsVisible()}
                                                onChange={column.getToggleVisibilityHandler()}
                                                className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-text-primary truncate flex-1">{column.id}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rows per page */}
                    <select
                        value={pageSize}
                        onChange={e => {
                            setPageSize(Number(e.target.value));
                            table.setPageSize(Number(e.target.value));
                        }}
                        className="px-3 py-2 text-sm bg-surface-elevated border border-border-medium rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {[25, 50, 100, 250].map(size => (
                            <option key={size} value={size} className="bg-surface">{size} rows</option>
                        ))}
                    </select>

                    {/* Pagination */}
                    <div className="flex items-center gap-1 ml-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="p-2 rounded-lg border border-border-subtle bg-surface text-text-muted hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 text-sm text-text-secondary">
                            <span className="font-medium text-text-primary">{pageInfo.pageIndex + 1}</span>
                            <span className="text-text-faint"> / </span>
                            <span>{totalPages || 1}</span>
                        </span>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="p-2 rounded-lg border border-border-subtle bg-surface text-text-muted hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm border-collapse" style={{ minWidth: table.getTotalSize() }}>
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-surface-overlay border-b border-border-subtle">
                            {table.getHeaderGroups()[0]?.headers.map(header => {
                                return (
                                    <th
                                        key={header.id}
                                        style={{ width: header.getSize() }}
                                        className="relative text-left group"
                                    >
                                        <div className="px-4 py-3">
                                            <div
                                                className={`flex items-center gap-2 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-primary' : ''} transition-colors`}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted group-hover:text-text-primary">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </span>
                                                {header.column.getIsSorted() === 'asc' && <SortAsc className="w-3.5 h-3.5 text-primary" />}
                                                {header.column.getIsSorted() === 'desc' && <SortDesc className="w-3.5 h-3.5 text-primary" />}
                                            </div>
                                        </div>
                                        {header.column.getCanResize() && (
                                            <div
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                className={`absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-primary/80 transition-all ${header.column.getIsResizing() ? 'bg-primary opacity-100' : ''}`}
                                            />
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border-subtle">
                        {table.getRowModel().rows.map((row, i) => (
                            <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                                {row.getVisibleCells().map(cell => {
                                    const value = String(cell.getValue() ?? '');
                                    const cellId = `${row.id}-${cell.id}`;
                                    return (
                                        <td
                                            key={cell.id}
                                            className="px-4 py-3 text-text-primary group relative"
                                            style={{ maxWidth: cell.column.getSize() }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="truncate" title={value}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(value, cellId)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-primary transition-all"
                                                    title="Copy"
                                                >
                                                    {copiedCell === cellId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {table.getRowModel().rows.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-text-muted">
                                        <Search className="w-12 h-12 opacity-30 text-text-faint" />
                                        <p className="text-lg font-medium text-text-secondary">No matching results</p>
                                        <p className="text-sm">Try adjusting your search or filters</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
