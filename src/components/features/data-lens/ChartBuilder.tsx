"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import {
    BarChart3, TrendingUp, Activity, PieChart as PieChartIcon,
    Plus, Trash2, ChevronDown, Sigma
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type ChartType = "bar" | "line" | "area" | "pie" | "scatter";
type AggregationType = "sum" | "avg" | "count" | "min" | "max";

interface ChartConfig {
    id: string;
    type: ChartType;
    xColumn: string;
    yColumn: string;
    aggregation: AggregationType;
    title: string;
}

interface ChartBuilderProps {
    data: any[];
    columns: string[];
}

// ============================================================================
// CHART COLORS
// ============================================================================

const CHART_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#06b6d4', '#f97316', '#84cc16', '#a855f7', '#14b8a6'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectColumnType(data: any[], column: string): "numeric" | "categorical" {
    if (!data.length) return "categorical";

    const sampleValues = data.slice(0, 100).map(row => row[column]);
    const numericCount = sampleValues.filter(v =>
        v !== null && v !== undefined && !isNaN(Number(v))
    ).length;

    return numericCount > sampleValues.length * 0.8 ? "numeric" : "categorical";
}

function aggregateData(
    data: any[],
    xColumn: string,
    yColumn: string,
    aggregation: AggregationType
): any[] {
    const grouped = new Map<string, number[]>();

    data.forEach(row => {
        const xValue = String(row[xColumn] ?? "");
        const yValue = Number(row[yColumn]);

        if (!isNaN(yValue)) {
            if (!grouped.has(xValue)) {
                grouped.set(xValue, []);
            }
            grouped.get(xValue)!.push(yValue);
        }
    });

    const result: any[] = [];
    grouped.forEach((values, key) => {
        let aggValue: number;

        switch (aggregation) {
            case "sum":
                aggValue = values.reduce((a, b) => a + b, 0);
                break;
            case "avg":
                aggValue = values.reduce((a, b) => a + b, 0) / values.length;
                break;
            case "count":
                aggValue = values.length;
                break;
            case "min":
                aggValue = Math.min(...values);
                break;
            case "max":
                aggValue = Math.max(...values);
                break;
            default:
                aggValue = values.reduce((a, b) => a + b, 0);
        }

        result.push({
            name: key,
            value: aggValue
        });
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================================================
// CHART RENDERER
// ============================================================================

function ChartRenderer({ config, data }: { config: ChartConfig; data: any[] }) {
    const chartData = useMemo(() => {
        return aggregateData(data, config.xColumn, config.yColumn, config.aggregation);
    }, [data, config]);

    if (!chartData.length) {
        return (
            <div className="h-full flex items-center justify-center text-text-muted">
                <p>No data available for this configuration</p>
            </div>
        );
    }

    const renderChart = () => {
        switch (config.type) {
            case "bar":
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 12 }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="value" fill={CHART_COLORS[0]} name={config.yColumn} radius={[8, 8, 0, 0]} />
                    </BarChart>
                );

            case "line":
                return (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 12 }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={CHART_COLORS[1]}
                            strokeWidth={2}
                            name={config.yColumn}
                            dot={{ fill: CHART_COLORS[1], r: 4 }}
                        />
                    </LineChart>
                );

            case "area":
                return (
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 12 }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="value"
                            fill={CHART_COLORS[2]}
                            fillOpacity={0.6}
                            stroke={CHART_COLORS[2]}
                            strokeWidth={2}
                            name={config.yColumn}
                        />
                    </AreaChart>
                );

            case "pie":
                return (
                    <PieChart>
                        <Pie
                            data={chartData.slice(0, 10)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}`}
                            labelLine={true}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                        />
                    </PieChart>
                );

            case "scatter":
                return (
                    <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 12 }} />
                        <YAxis dataKey="value" stroke="#6b7280" style={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            cursor={{ strokeDasharray: '3 3' }}
                        />
                        <Legend />
                        <Scatter name={config.yColumn} data={chartData} fill={CHART_COLORS[4]} />
                    </ScatterChart>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-surface-secondary rounded-2xl border border-border-subtle shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">{config.title}</h3>
                <span className="text-xs text-text-secondary">
                    {config.aggregation.toUpperCase()} of {config.yColumn} by {config.xColumn}
                </span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
                {renderChart()}
            </ResponsiveContainer>
        </div>
    );
}

// ============================================================================
// MAIN CHART BUILDER
// ============================================================================

export function ChartBuilder({ data, columns }: ChartBuilderProps) {
    const [charts, setCharts] = useState<ChartConfig[]>([]);
    const [showConfig, setShowConfig] = useState(true);

    // Detect column types
    const columnTypes = useMemo(() => {
        const types: Record<string, "numeric" | "categorical"> = {};
        columns.forEach(col => {
            types[col] = detectColumnType(data, col);
        });
        return types;
    }, [data, columns]);

    const numericColumns = columns.filter(col => columnTypes[col] === "numeric");
    const categoricalColumns = columns.filter(col => columnTypes[col] === "categorical");

    const addChart = (type: ChartType) => {
        const defaultXColumn = categoricalColumns[0] || columns[0] || "";
        const defaultYColumn = numericColumns[0] || columns[1] || columns[0] || "";

        const newChart: ChartConfig = {
            id: `chart-${Date.now()}`,
            type,
            xColumn: defaultXColumn,
            yColumn: defaultYColumn,
            aggregation: "sum",
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`
        };

        setCharts([...charts, newChart]);
    };

    const removeChart = (id: string) => {
        setCharts(charts.filter(chart => chart.id !== id));
    };

    const updateChart = (id: string, updates: Partial<ChartConfig>) => {
        setCharts(charts.map(chart =>
            chart.id === id ? { ...chart, ...updates } : chart
        ));
    };

    if (!data.length || !columns.length) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-surface">
                <div className="w-32 h-32 rounded-3xl bg-surface-elevated border border-border-medium shadow-sm flex items-center justify-center mb-8">
                    <BarChart3 className="w-16 h-16 text-text-muted" />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">No Data to Visualize</h3>
                <p className="text-text-secondary max-w-md text-center">
                    Load a dataset from the Data tab to create beautiful visualizations
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-secondary">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-text-primary">Chart Builder</h2>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg">
                            {data.length} rows • {columns.length} columns
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowConfig(!showConfig)}
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform ${showConfig ? '' : 'rotate-180'}`} />
                            {showConfig ? 'Hide' : 'Show'} Controls
                        </Button>
                    </div>
                </div>

                {/* Chart Type Buttons */}
                {showConfig && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button onClick={() => addChart("bar")} size="sm" variant="outline" className="gap-1.5">
                            <BarChart3 className="w-4 h-4" /> Bar Chart
                        </Button>
                        <Button onClick={() => addChart("line")} size="sm" variant="outline" className="gap-1.5">
                            <TrendingUp className="w-4 h-4" /> Line Chart
                        </Button>
                        <Button onClick={() => addChart("area")} size="sm" variant="outline" className="gap-1.5">
                            <Activity className="w-4 h-4" /> Area Chart
                        </Button>
                        <Button onClick={() => addChart("pie")} size="sm" variant="outline" className="gap-1.5">
                            <PieChartIcon className="w-4 h-4" /> Pie Chart
                        </Button>
                        <Button onClick={() => addChart("scatter")} size="sm" variant="outline" className="gap-1.5">
                            <BarChart3 className="w-4 h-4" /> Scatter Plot
                        </Button>
                    </div>
                )}
            </div>

            {/* Charts Grid */}
            <div className="flex-1 overflow-auto p-6">
                {charts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-muted">
                        <Plus className="w-16 h-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium">No charts yet</p>
                        <p className="text-sm">Click a chart type above to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {charts.map(chart => (
                            <div key={chart.id} className="relative">
                                {showConfig && (
                                    <div className="mb-4 p-4 bg-surface rounded-xl border border-border-medium shadow-sm">
                                        {/* Chart Title */}
                                        <div className="mb-3">
                                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                                Chart Title
                                            </label>
                                            <input
                                                type="text"
                                                value={chart.title}
                                                onChange={(e) => updateChart(chart.id, { title: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-border-medium bg-surface-overlay text-text-primary placeholder-(--text-faint) rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                                                placeholder="Enter chart title..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                                    X-Axis (Category)
                                                </label>
                                                <select
                                                    value={chart.xColumn}
                                                    onChange={(e) => updateChart(chart.id, { xColumn: e.target.value })}
                                                    className="w-full px-3 py-2 text-sm border border-border-medium bg-surface-overlay text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    {columns.map(col => (
                                                        <option key={col} value={col}>{col}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                                    Y-Axis (Value)
                                                </label>
                                                <select
                                                    value={chart.yColumn}
                                                    onChange={(e) => updateChart(chart.id, { yColumn: e.target.value })}
                                                    className="w-full px-3 py-2 text-sm border border-border-medium bg-surface-overlay text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    {numericColumns.length > 0 ? (
                                                        numericColumns.map(col => (
                                                            <option key={col} value={col}>{col}</option>
                                                        ))
                                                    ) : (
                                                        columns.map(col => (
                                                            <option key={col} value={col}>{col}</option>
                                                        ))
                                                    )}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
                                                    <Sigma className="w-3 h-3" /> Aggregation
                                                </label>
                                                <select
                                                    value={chart.aggregation}
                                                    onChange={(e) => updateChart(chart.id, { aggregation: e.target.value as AggregationType })}
                                                    className="w-full px-3 py-2 text-sm border border-border-medium bg-surface-overlay text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    <option value="sum">Sum</option>
                                                    <option value="avg">Average</option>
                                                    <option value="count">Count</option>
                                                    <option value="min">Minimum</option>
                                                    <option value="max">Maximum</option>
                                                </select>
                                            </div>

                                            <div className="flex items-end">
                                                <Button
                                                    onClick={() => removeChart(chart.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <ChartRenderer config={chart} data={data} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
