// src/types/open-draw.ts
// TypeScript types for the Open Draw diagramming tool

import type { Node, Edge, Viewport } from '@xyflow/react';

// ── Graph ──────────────────────────────────────────────────────────────────

/** Snapshot of the full diagram state (persisted to file) */
export interface GraphState {
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
}

// ── Node data shapes ────────────────────────────────────────────────────────

/** Base data shared by all custom OpenDraw nodes */
export interface BaseNodeData extends Record<string, unknown> {
  label?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  opacity?: number;
}

// ── Edge data shapes ────────────────────────────────────────────────────────

/** Data attached to custom OpenDraw edges */
export interface CustomEdgeData extends Record<string, unknown> {
  label?: string;
  color?: string;
  strokeWidth?: number;
}

// ── Export ──────────────────────────────────────────────────────────────────

/** Supported export formats */
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json';

// ── History ────────────────────────────────────────────────────────────────

/** Options passed to the useHistory hook */
export interface HistoryOptions {
  maxHistory: number;
  debounceMs: number;
  enableKeyboardShortcuts: boolean;
}
