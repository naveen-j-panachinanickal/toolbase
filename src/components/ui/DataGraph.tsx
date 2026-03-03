"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type DataGraphProps = {
  value: unknown;
  rootLabel?: string;
  className?: string;
  maxDepth?: number;
  maxNodes?: number;
  defaultExpandDepth?: number;
  expandedPaths?: Set<string>;
  onTogglePath?: (path: string) => void;
};

type NodeValue = Record<string, unknown> | unknown[];

function isNodeValue(value: unknown): value is NodeValue {
  return value !== null && typeof value === "object";
}

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function inlinePreview(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean" || value === null) return String(value);
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === "object") return "{...}";
  return String(value);
}

export function DataGraph({
  value,
  rootLabel = "root",
  className,
  maxDepth = 7,
  maxNodes = 260,
  defaultExpandDepth = 2,
  expandedPaths,
  onTogglePath,
}: DataGraphProps) {
  const [hasUserOverride, setHasUserOverride] = useState(false);

  useEffect(() => {
    setHasUserOverride(false);
  }, [value, defaultExpandDepth, maxDepth, maxNodes, rootLabel]);

  const counter = useMemo(() => ({ count: 0 }), [value, maxDepth, maxNodes, expandedPaths, defaultExpandDepth]);

  const renderNode = (label: string, node: unknown, path: string, depth: number): React.ReactNode => {
    if (counter.count >= maxNodes) return null;
    counter.count += 1;

    const kind = valueType(node);
    const isContainer = isNodeValue(node);
    const defaultExpanded = depth < defaultExpandDepth;
    const isExpanded = hasUserOverride
      ? !!expandedPaths?.has(path)
      : !!expandedPaths?.has(path) || defaultExpanded;
    const showChildren = isContainer && isExpanded && depth < maxDepth;

    const onToggle = () => {
      setHasUserOverride(true);
      onTogglePath?.(path);
    };

    return (
      <div key={path} className="pl-4 border-l border-gray-200/80 first:pl-0 first:border-l-0">
        <div className="flex items-center gap-2 py-1 text-sm">
          {isContainer ? (
            <button
              type="button"
              onClick={onToggle}
              className="h-5 w-5 shrink-0 rounded border border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-50"
              aria-label={isExpanded ? "Collapse node" : "Expand node"}
            >
              {isExpanded ? "-" : "+"}
            </button>
          ) : (
            <span className="h-5 w-5 shrink-0" />
          )}

          <span className="font-semibold text-gray-800">{label}</span>
          <span className="text-xs uppercase tracking-wider text-gray-500">{kind}</span>
          {!isContainer && <span className="text-xs text-gray-600 truncate">{inlinePreview(node)}</span>}
        </div>

        {isContainer && !showChildren && depth >= maxDepth && (
          <div className="ml-7 text-xs text-amber-700 py-1">Depth limit reached</div>
        )}

        {showChildren && (
          <div className="space-y-1">
            {Array.isArray(node)
              ? node.map((item, idx) => renderNode(String(idx), item, `${path}.${idx}`, depth + 1))
              : Object.entries(node).map(([key, child]) => renderNode(key, child, `${path}.${key}`, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = renderNode(rootLabel, value, rootLabel, 0);
  const visited = counter.count;

  return (
    <div className={cn("rounded-xl border border-black/10 bg-white/70 p-3 overflow-auto", className)}>
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>Structured View</span>
        <span>{visited} nodes</span>
      </div>
      <div className="min-w-0">{tree}</div>
      {visited >= maxNodes && (
        <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
          Node limit reached ({maxNodes}). Increase the limit to inspect more.
        </div>
      )}
    </div>
  );
}
