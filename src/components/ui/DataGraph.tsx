"use client";

import React from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronDown, ChevronRight } from "lucide-react";
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

type GraphNodeKind = "root" | "object" | "group" | "key";

type GraphNodeData = {
  kind: GraphNodeKind;
  title: string;
  lines: string[];
  path: string;
  canExpand: boolean;
  isExpanded: boolean;
  onTogglePath?: (path: string) => void;
};

type LayoutResult = {
  id: string;
  y: number;
};

type ChildSpec = {
  label: string;
  edgeLabel: string;
  value: unknown;
  path: string;
  kind: GraphNodeKind;
};

const X_GAP = 360;
const Y_GAP = 130;

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isContainer(value: unknown): boolean {
  return Array.isArray(value) || isObjectLike(value);
}

function preview(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (isObjectLike(value)) return `{${Object.keys(value).length} keys}`;
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function buildNodeLines(value: unknown, kind: GraphNodeKind): string[] {
  if (!isObjectLike(value) && !Array.isArray(value)) {
    return [preview(value)];
  }

  const entries = Array.isArray(value)
    ? value.map((v, idx) => [String(idx), v] as const)
    : Object.entries(value);

  const primitiveEntries = entries.filter(([, v]) => !isContainer(v));
  const limit = kind === "key" ? 6 : 5;
  const lines = primitiveEntries.slice(0, limit).map(([k, v]) => `${k}: ${preview(v)}`);

  if (primitiveEntries.length > limit) {
    lines.push(`+${primitiveEntries.length - limit} more`);
  }

  if (lines.length === 0) {
    return [Array.isArray(value) ? `[${value.length} items]` : `{${entries.length} keys}`];
  }

  return lines;
}

function buildChildren(value: unknown, path: string, kind: GraphNodeKind): ChildSpec[] {
  if (Array.isArray(value)) {
    return value
      .map((item, idx): ChildSpec | null => {
        const childPath = `${path}/${idx}`;
        if (isObjectLike(item)) {
          return {
            label: item.name && typeof item.name === "string" ? item.name : `Item ${idx + 1}`,
            edgeLabel: `[${idx}]`,
            value: item,
            path: childPath,
            kind: "object",
          };
        }
        if (Array.isArray(item)) {
          return {
            label: `Group ${idx + 1}`,
            edgeLabel: `[${idx}]`,
            value: item,
            path: childPath,
            kind: "group",
          };
        }
        return {
          label: `[${idx}]`,
          edgeLabel: `[${idx}]`,
          value: item,
          path: childPath,
          kind: "key",
        };
      })
      .filter(Boolean) as ChildSpec[];
  }

  if (!isObjectLike(value)) return [];

  return Object.entries(value).map(([key, v]) => {
    const childPath = `${path}/${encodeURIComponent(key)}`;
    if (isObjectLike(v)) {
      return {
        label: key,
        edgeLabel: key,
        value: v,
        path: childPath,
        kind: "group" as const,
      };
    }
    if (Array.isArray(v)) {
      return {
        label: key,
        edgeLabel: key,
        value: v,
        path: childPath,
        kind: "group" as const,
      };
    }
    return {
      label: key,
      edgeLabel: key,
      value: v,
      path: childPath,
      kind: "key" as const,
    };
  });
}

function GraphCardNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const isRoot = data.kind === "root";
  return (
    <div
      className={cn(
        "min-w-[250px] max-w-[320px] rounded-xl border bg-white text-slate-800 shadow-[0_10px_30px_rgba(20,44,71,0.12)]",
        isRoot ? "border-sky-200/90" : "border-slate-200"
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-slate-300 !bg-white" />
      <div className={cn("flex items-center gap-2 border-b px-3 py-2", isRoot ? "border-sky-100 bg-sky-50/70" : "border-slate-200 bg-slate-50/70")}>
        {data.canExpand ? (
          <button
            type="button"
            onClick={() => data.onTogglePath?.(data.path)}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-sky-600 hover:bg-sky-100"
          >
            {data.isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="inline-flex h-5 w-5 items-center justify-center text-slate-300">•</span>
        )}
        <span className="truncate text-sm font-semibold text-slate-800">{data.title}</span>
        <span className="ml-auto rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
          {data.kind}
        </span>
      </div>
      <div className="px-3 py-2">
        {data.lines.map((line, idx) => {
          const splitAt = line.indexOf(":");
          if (splitAt <= 0) {
            return (
              <div key={`${line}-${idx}`} className="truncate py-0.5 text-sm text-slate-700">
                {line}
              </div>
            );
          }
          const k = line.slice(0, splitAt);
          const v = line.slice(splitAt + 1).trim();
          return (
            <div key={`${line}-${idx}`} className="flex items-start gap-2 py-0.5 text-sm">
              <span className="shrink-0 font-medium text-sky-600">{k}:</span>
              <span className="truncate text-slate-800">{v}</span>
            </div>
          );
        })}
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-slate-300 !bg-white" />
    </div>
  );
}

const nodeTypes = {
  graphCard: GraphCardNode,
};

export function DataGraph({
  value,
  rootLabel = "root",
  className,
  maxDepth = 8,
  maxNodes = 600,
  defaultExpandDepth = 2,
  expandedPaths,
  onTogglePath,
}: DataGraphProps) {
  const safeMaxDepth = Math.max(1, maxDepth);
  const safeMaxNodes = Math.max(1, maxNodes);
  const safeDefaultExpandDepth = Math.max(0, defaultExpandDepth);

  const graph = React.useMemo(() => {
    const nodes: Node<GraphNodeData>[] = [];
    const edges: Edge[] = [];
    let yCursor = 0;
    let nodeCounter = 0;
    let truncated = false;

    const build = (
      currentValue: unknown,
      kind: GraphNodeKind,
      title: string,
      path: string,
      depth: number,
      parentId?: string,
      edgeLabel?: string
    ): LayoutResult | null => {
      if (nodes.length >= safeMaxNodes) {
        truncated = true;
        return null;
      }

      const id = `n_${nodeCounter++}`;
      const children = buildChildren(currentValue, path, kind);
      const canExpand = children.length > 0 && depth < safeMaxDepth;
      const isManuallyExpanded = expandedPaths?.has(path) ?? false;
      const isExpanded = canExpand && (isManuallyExpanded || depth < safeDefaultExpandDepth);

      const childLayouts = (isExpanded ? children : [])
        .map((child) =>
          build(
            child.value,
            child.kind,
            child.label,
            child.path,
            depth + 1,
            id,
            child.edgeLabel
          )
        )
        .filter(Boolean) as LayoutResult[];

      const y =
        childLayouts.length > 0
          ? (childLayouts[0].y + childLayouts[childLayouts.length - 1].y) / 2
          : (() => {
              const current = yCursor;
              yCursor += Y_GAP;
              return current;
            })();

      nodes.push({
        id,
        type: "graphCard",
        position: { x: depth * X_GAP, y },
        draggable: false,
        selectable: false,
        data: {
          kind,
          title,
          lines: buildNodeLines(currentValue, kind),
          path,
          canExpand,
          isExpanded,
          onTogglePath,
        },
      });

      if (parentId) {
        edges.push({
          id: `e_${parentId}_${id}`,
          source: parentId,
          target: id,
          type: "smoothstep",
          style: { stroke: "#8ea4bc", strokeWidth: 2 },
          label: edgeLabel,
          labelStyle: { fill: "#5f7086", fontSize: 12, fontWeight: 600 },
          labelBgStyle: { fill: "#ffffff", fillOpacity: 0.92 },
          labelBgPadding: [6, 2],
        });
      }

      return { id, y };
    };

    let rootKind: GraphNodeKind = "root";
    let rootValue = value;
    const rootPath = "$";

    if (Array.isArray(value)) {
      rootKind = "root";
    } else if (isObjectLike(value)) {
      rootKind = "root";
    } else {
      rootKind = "key";
    }

    build(rootValue, rootKind, rootLabel, rootPath, 0);

    return { nodes, edges, truncated };
  }, [value, rootLabel, safeMaxDepth, safeMaxNodes, safeDefaultExpandDepth, expandedPaths, onTogglePath]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.10)]",
        className
      )}
    >
      <div className="h-full min-h-[280px]">
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnDoubleClick={false}
        >
          <Background color="#dbe5f0" gap={26} />
          <MiniMap pannable zoomable className="!bg-white/90 !border !border-slate-200 !backdrop-blur" />
          <Controls className="!bg-white/90 !border !border-slate-200 !text-slate-600 !backdrop-blur" showInteractive={false} />
        </ReactFlow>
      </div>

      {graph.truncated && (
        <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Node limit reached ({safeMaxNodes}). Increase the node cap to render more.
        </div>
      )}
    </div>
  );
}
