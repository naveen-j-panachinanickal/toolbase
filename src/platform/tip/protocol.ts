/**
 * TIP Protocol — Core Types
 *
 * This is the heart of the Toolbase Interoperability Protocol.
 * It defines every type that flows through TIP: content types, payloads,
 * bundles, config schemas, hooks, and the TIPTool interface itself.
 *
 * Key design principles:
 *  - Blobs are the universal currency (binary-safe, lazy, transferable)
 *  - MIME types are the universal language (everyone already knows them)
 *  - Tools always receive and return a TIPBundle — never a single item
 *  - The protocol is pure TypeScript — no React, no workers, no WASM
 */

import { TIP_VERSION, TIPVersion } from './version';

// ─── Content Types ────────────────────────────────────────────────────────────
// Standard MIME types. Every developer already knows these.
// Add new types here as Toolbase grows — keep alphabetically sorted.

export const TIP_CONTENT_TYPES = [
  'application/json',
  'application/octet-stream', // binary fallback
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'text/html',
  'text/plain',
] as const;

export type TIPContentType = (typeof TIP_CONTENT_TYPES)[number];

// Re-export TIPVersion so consumers only need one import
export type { TIPVersion };
export { TIP_VERSION };

/**
 * A single unit of data flowing through the TIP protocol.
 * 
 * Always backed by a Blob to ensure binary safety and memory efficiency 
 * (transferable between threads).
 */
export interface TIPPayload {
  /** The standard MIME type of this payload. */
  contentType: TIPContentType;

  /** The binary data itself. */
  data: Blob;

  /** Associated metadata for this specific payload. */
  meta: TIPPayloadMeta;
}

export interface TIPPayloadMeta {
  /** Original or derived filename */
  filename: string;

  /** File size in bytes */
  sizeBytes: number;

  /** Full MIME type (may include charset etc.) */
  mimeType: string;

  /** Which TIPTool produced this payload (stamped by engine) */
  producedBy?: string;

  /** How long the producing tool took in ms (stamped by engine) */
  durationMs?: number;

  /** Protocol version that produced this */
  tipVersion?: TIPVersion;

  /** Arbitrary extra metadata — for tool-specific needs */
  extra?: Record<string, unknown>;
}

/**
 * The standard input and output unit for all TIP tools.
 * 
 * Tools always receive and return a TIPBundle. This simplifies tool 
 * implementation by removing the need to handle single vs multiple files.
 */
export interface TIPBundle {
  /** An array of payloads. A single file is represented as an array of length 1. */
  payloads: TIPPayload[];

  /**
   * The primary content type of the bundle.
   * Used for compatibility checks during pipeline orchestration.
   */
  contentType: TIPContentType;

  /** Bundle-level metadata (total size, count, etc). */
  meta: TIPBundleMeta;
}

export interface TIPBundleMeta {
  /** Total number of payloads */
  count: number;

  /** Total bytes across all payloads */
  totalSizeBytes: number;

  /** Protocol version used to create this bundle */
  tipVersion: TIPVersion;

  /** ISO-8601 timestamp of when this bundle was created */
  createdAt: string;
}

// ─── Config Schema ─────────────────────────────────────────────────────────────
// A minimal JSON-Schema-inspired config system.
// Simple enough for contributors to write, rich enough for the UI to auto-render.

export type TIPConfigFieldType =
  | 'boolean'
  | 'number'
  | 'password'
  | 'select'
  | 'string';

export interface TIPConfigField {
  /** Unique key for this field — used as the key in TIPConfig */
  key: string;

  /** Human-readable label shown in the UI */
  label: string;

  /** Field type — drives the UI widget rendered */
  type: TIPConfigFieldType;

  /** Default value — used when the user hasn't changed the field */
  default: string | number | boolean;

  /** If true, invoking without this field should throw CONFIG_INVALID */
  required?: boolean;

  /** Shown as helper text in the UI */
  description?: string;

  // ── For 'number' type ──────────────────────────────────────────────────────
  min?: number;
  max?: number;
  step?: number;
  /** Display unit appended to the value, e.g. 'DPI', '%', 'px' */
  unit?: string;

  // ── For 'select' type ──────────────────────────────────────────────────────
  options?: Array<{ label: string; value: string | number }>;
}

export interface TIPConfigSchema {
  fields: TIPConfigField[];
}

/** The resolved config passed into tool.invoke() */
export type TIPConfig = Record<string, string | number | boolean>;

// ─── Interactive Node Protocol ─────────────────────────────────────────────────
// Some tools require user interaction before execution (reorder, crop, annotate).
// Interaction components implement TIPInteractionProps and are rendered inside
// the pipeline's InteractionModal — reusing the exact same UI as the direct tool.

/**
 * Props that every interaction component MUST accept.
 * Interaction components are rendered inside InteractionModal in the pipeline.
 */
export interface TIPInteractionProps {
  /** Files flowing into this node from upstream (passed in when available) */
  files: File[];
  /** Current node config draft */
  config: Record<string, unknown>;
  /**
   * Called when the user confirms. `files` is the final ordered/filtered
   * list to use as the execution input. `config` carries any extra settings.
   */
  onConfirm: (result: TIPInteractionResult) => void;
  /** Called when the user cancels — modal closes, node state unchanged */
  onCancel: () => void;
}

/** The result emitted by an interaction component on confirm */
export interface TIPInteractionResult {
  /** Final ordered file list to use as the execution bundle */
  files: File[];
  /** Optional extra config values captured in the interaction UI */
  config?: Record<string, unknown>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
// Standard hooks every tool receives during invocation.
// Progress, logging, and cancellation — the same for every tool.

export interface TIPHooks {
  /**
   * Report progress as a percentage (0–100).
   * The engine forwards this to engineHooks.onStepProgress.
   */
  onProgress: (percent: number, message?: string) => void;

  /** Structured log output — the engine forwards to the console */
  onLog: (message: string, level: 'error' | 'info' | 'warn') => void;

  /**
   * Cancellation signal — tools MUST check this signal.aborted
   * before each async sub-operation and throw TIPError('CANCELLED', ...).
   */
  signal: AbortSignal;
}

/**
 * The standard interface for all tools in Toolbase.
 * 
 * Every tool must implement this contract to be eligible for 
 * registration and usage in the Pipeline Builder.
 */
export interface TIPTool {
  /**
   * Unique identifier for the tool.
   * Recommended format: 'namespace/operation' (e.g., 'pixels/resize').
   */
  id: string;

  /** Human-readable display name. */
  name: string;

  /** A concise description of the tool's purpose. */
  description: string;

  /** The set of content types this tool can process as input. */
  consumes: TIPContentType[];

  /** The set of content types this tool produces as output. */
  produces: TIPContentType[];

  /** Whether the tool is optimized for mobile usage. */
  mobileOptimized: boolean;

  /**
   * Defines the user-configurable settings for this tool.
   * Powers the auto-generated configuration UI in the Pipeline.
   */
  configSchema: TIPConfigSchema;

  /**
   * The core execution logic of the tool.
   * 
   * @param input - The input bundle containing one or more payloads.
   * @param config - User-provided settings based on the configSchema.
   * @param hooks - Runtime hooks for progress reporting and cancellation.
   * @returns A promise resolving to the output bundle.
   */
  invoke(
    input: TIPBundle,
    config: TIPConfig,
    hooks: TIPHooks
  ): Promise<TIPBundle>;

  /**
   * Interactive Node Protocol (INP)
   * 
   * Set to true if the tool requires manual user intervention 
   * (e.g., cropping, selecting pages) before it can execute.
   */
  interactable?: true;

  /**
   * Lazily loads the interaction component for this tool.
   * Only used if interactable is true.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getInteractionComponent?: () => Promise<(props: TIPInteractionProps) => any>;
}

