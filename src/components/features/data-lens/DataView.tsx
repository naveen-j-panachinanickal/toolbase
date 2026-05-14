"use client";

import React from "react";
import { FilterBuilder, FilterCondition } from "./FilterBuilder";
import { DataTable } from "./DataTable";
import { Button } from "@/components/ui/Button";
import { Table as TableIcon, Code2, Terminal } from "lucide-react";
import { TableSchema } from "@/hooks/useDataLens";

interface DataViewProps {
    tableData: any[];
    currentColumns: string[];
    activeSchema?: TableSchema;
    onApplyFilters: (conditions: FilterCondition[]) => void;
    onSwitchToSql: () => void;
    onSwitchToPython: () => void;
    title?: string;
}

export function DataView({
    tableData,
    currentColumns,
    activeSchema,
    onApplyFilters,
    onSwitchToSql,
    onSwitchToPython,
    title
}: DataViewProps) {
    if (tableData.length === 0) {
        const isResultEmpty = title === "Query Result" || title === "Analysis Result";

        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-surface p-8">
                <div className="w-32 h-32 rounded-3xl bg-surface-secondary border border-border-medium shadow-xl flex items-center justify-center mb-8 relative">
                    <TableIcon className="w-16 h-16 text-text-faint" />
                    {isResultEmpty && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500 border-4 border-surface-secondary flex items-center justify-center text-white font-bold text-lg shadow-sm">!</div>
                    )}
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">
                    {isResultEmpty ? "No Data Found" : "Ready to Explore Data"}
                </h3>
                <p className="text-text-secondary max-w-sm text-center mb-10 leading-relaxed">
                    {isResultEmpty
                        ? "Your query executed successfully but returned zero results. Adjust your filters or try a different query."
                        : "Upload a file from the sidebar, or write a query to start analyzing your data."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={onSwitchToSql}
                        variant="outline"
                        size="lg"
                        className="gap-2 bg-surface-overlay border-border-medium text-text-secondary hover:bg-surface-hover hover:border-border-subtle hover:text-text-primary transition-all shadow-sm rounded-xl px-8"
                    >
                        <Code2 className="w-5 h-5 text-primary" /> {isResultEmpty ? "Refine SQL Query" : "Write SQL Query"}
                    </Button>
                    <Button
                        onClick={onSwitchToPython}
                        size="lg"
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all rounded-xl px-8"
                    >
                        <Terminal className="w-5 h-5" /> {isResultEmpty ? "Refine Python Code" : "Run Python Code"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-surface">
            <FilterBuilder schema={activeSchema} onApply={onApplyFilters} />
            <div className="flex-1 overflow-hidden">
                <DataTable data={tableData} columns={currentColumns} />
            </div>
        </div>
    );
}
