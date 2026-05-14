/**
 * Pipeline Types
 * Used by the Pipeline Builder UI, usePipelineEngine hook, and save/export/import.
 */

// ─── Pipeline Step ────────────────────────────────────────────────────────────

export interface PipelineStep {
  /** Unique instance ID for this step (not the tool ID) */
  id: string;
  /** The TIPTool.id to invoke — e.g. 'magic-pdf/compress' */
  toolId: string;
  /** Resolved config for this invocation */
  config: Record<string, string | number | boolean>;
}

// ─── Pipeline Definition ──────────────────────────────────────────────────────

export interface PipelineDefinition {
  /** Unique pipeline ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Optional description */
  description?: string;
  /** Ordered list of steps */
  steps: PipelineStep[];
  /** ISO-8601 creation timestamp */
  createdAt: string;
  /** True when this is a built-in preset (not user-created) */
  isPreset?: boolean;
  /** GitHub username of the pipeline author */
  author?: string;
  /** TIP version this pipeline was built against */
  tipVersion?: string;
  /** Preserved generic UI state (React Flow nodes and edges) for perfect canvas restoration */
  ui?: {
    nodes: any[];
    edges: any[];
  }
}

// ─── Step Execution Status ────────────────────────────────────────────────────

export type StepStatus = 'idle' | 'running' | 'complete' | 'error' | 'skipped' | 'paused';

export interface StepState {
  status: StepStatus;
  /** 0–100 */
  progress: number;
  /** Latest progress message from the tool */
  message: string;
  /** Wall-clock duration once complete */
  durationMs: number;
  error: string | null;
}

// ─── Pipeline Engine State ────────────────────────────────────────────────────

export type PipelineStatus = 'idle' | 'running' | 'complete' | 'error' | 'cancelled' | 'paused';

export interface PipelineEngineState {
  status: PipelineStatus;
  currentStepIndex: number;
  steps: StepState[];
  error: string | null;
}
