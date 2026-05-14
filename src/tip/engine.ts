/**
 * TIPEngine — Pipeline Execution
 *
 * The engine is the runtime that executes a TIP pipeline.
 * It takes a sequence of steps (toolId + config) and an initial TIPBundle,
 * then runs each tool in order, passing the output of one as the input to the next.
 *
 * Key responsibilities:
 *  1. Validate each step (tool exists, type is compatible)
 *  2. Apply type transformers when needed
 *  3. Invoke each tool with the standard TIPHooks
 *  4. Stamp each output bundle with producer metadata
 *  5. Fire engine-level hooks so the UI can observe progress
 *  6. Honour AbortSignal — cancel cleanly at any point
 *
 * The engine has NO React dependency. Wrap it in usePipelineEngine (Phase 7)
 * to connect it to React state.
 */

import { TIP_CONTENT_TYPES } from './protocol';
import type { TIPBundle, TIPConfig, TIPHooks, TIPContentType } from './protocol';
import { TIPToolRegistry } from './registry';
import { findTransformer } from './transformers';
import { TIPError } from './errors';
import { stampBundle } from './bundle';

// ─── Step Definition ──────────────────────────────────────────────────────────

/**
 * A single step in a TIP pipeline.
 * The engine resolves toolId → TIPTool via TIPToolRegistry.
 */
export interface TIPPipelineStep {
  /** Must match a registered TIPTool.id */
  toolId: string;
  /** Config values for this invocation */
  config: TIPConfig;
}

// ─── Engine Hooks ─────────────────────────────────────────────────────────────

/**
 * Callbacks the engine fires as it progresses through the pipeline.
 * The React hook (usePipelineEngine) maps these to setState calls.
 * Non-React consumers (e.g., a CLI) can log to the console instead.
 */
export interface TIPEngineHooks {
  /** Fired immediately before a step's tool.invoke() is called */
  onStepStart:    (stepIndex: number, toolId: string) => void;
  /** Forwarded from tool's hooks.onProgress — 0–100 */
  onStepProgress: (stepIndex: number, percent: number, message?: string) => void;
  /** Fired when tool.invoke() resolves successfully */
  onStepComplete: (stepIndex: number, toolId: string, durationMs: number) => void;
  /** Fired when tool.invoke() rejects or a protocol error occurs */
  onStepError:    (stepIndex: number, toolId: string, error: TIPError) => void;
}

// ─── Pipeline Execution ───────────────────────────────────────────────────────

/**
 * Execute a TIP pipeline.
 *
 * @param steps        - Ordered list of steps to execute
 * @param initialBundle - The starting data (typically the user's uploaded file)
 * @param engineHooks  - Callbacks for observing execution progress
 * @param signal       - AbortSignal — cancel the pipeline from the outside
 *
 * @returns The final TIPBundle produced by the last step
 *
 * @throws TIPError with code 'CANCELLED'       if the signal fires
 * @throws TIPError with code 'TOOL_NOT_FOUND'  if a toolId has no registration
 * @throws TIPError with code 'TYPE_MISMATCH'   if types are incompatible
 * @throws TIPError with code 'EXECUTION_FAILED' if a tool throws a non-TIPError
 */
export async function executeTIPPipeline(
  steps: TIPPipelineStep[],
  initialBundle: TIPBundle,
  engineHooks: TIPEngineHooks,
  signal: AbortSignal,
  onPauseCheck?: (index: number) => Promise<void>
): Promise<TIPBundle> {
  let current: TIPBundle | null = initialBundle;

  for (let i = 0; i < steps.length; i++) {
    // ── Pause check ──
    if (onPauseCheck) {
        await onPauseCheck(i);
    }

    // ── Cancellation check (before step) ──────────────────────────────────────
    if (signal.aborted) {
      throw new TIPError('CANCELLED', 'Pipeline cancelled by user', i);
    }

    const step = steps[i];

    // ── Pause check (pre-resolve) ──
    if (onPauseCheck) await onPauseCheck(i);

    // ── Tool resolution ────────────────────────────────────────────────────────
    const tool = TIPToolRegistry.get(step.toolId);

    if (!tool) {
      throw new TIPError(
        'TOOL_NOT_FOUND',
        `Tool "${step.toolId}" is not registered`,
        i,
        step.toolId
      );
    }

    // Capture the input for this step and clear the outer reference early
    // to allow GC of previous steps' data during long-running tool invocations.
    let input = current!;
    current = null;

    // ── Type compatibility ─────────────────────────────────────────────────────
    const canConsumeDirect = tool.consumes.includes(input.contentType);

    // Try to find a transformer for each accepted type the tool declares
    const transformer = !canConsumeDirect
      ? tool.consumes.reduce<ReturnType<typeof findTransformer>>(
          (found, accepted) => found ?? findTransformer(input.contentType, accepted),
          undefined
        )
      : undefined;

    if (!canConsumeDirect && !transformer) {
      throw new TIPError(
        'TYPE_MISMATCH',
        `Tool "${tool.name}" cannot consume "${input.contentType}". ` +
          `It accepts: ${tool.consumes.join(', ')}`,
        i,
        step.toolId
      );
    }

    // ── Invocation ────────────────────────────────────────────────────────────
    if (signal.aborted) throw new TIPError('CANCELLED', 'Pipeline cancelled', i);
    
    // ── Pause check (pre-hook) ──
    if (onPauseCheck) await onPauseCheck(i);

    engineHooks.onStepStart(i, step.toolId);
    if (signal.aborted) throw new TIPError('CANCELLED', 'Pipeline cancelled', i);
    
    const start = performance.now();

    // ── Type coercion (if needed) ──────────────────────────────────────────────
    if (transformer) {
      // ── Pause check (pre-transform) ──
      if (onPauseCheck) await onPauseCheck(i);

      input = await transformer.transform(input, signal);

      // ── Pause check (post-transform) ──
      if (onPauseCheck) await onPauseCheck(i);

      if (signal.aborted) {
        throw new TIPError('CANCELLED', 'Pipeline cancelled by user', i);
      }
    }

    /** Per-step hooks — bridge tool progress reports to engine-level hooks */
    const stepHooks: TIPHooks = {
      onProgress: (percent, message) => {
        if (!signal.aborted) engineHooks.onStepProgress(i, percent, message);
      },
      onLog: (message, level) => {
        if (signal.aborted) return;
        if (level === 'error') console.error(`[TIP][${tool.id}]`, message);
        else if (level === 'warn') console.warn(`[TIP][${tool.id}]`, message);
        else console.log(`[TIP][${tool.id}]`, message);
      },
      signal,
    };

    try {
      // ── Pause check (pre-invoke) ──
      if (onPauseCheck) await onPauseCheck(i);

      const result = await tool.invoke(input, step.config, stepHooks);

      // ── Pause check (post-invoke) ──
      if (onPauseCheck) await onPauseCheck(i);

      if (signal.aborted) {
        throw new TIPError('CANCELLED', 'Pipeline cancelled by user', i);
      }

      // ── Output Validation ───────────────────────────────────────────────────
      // Verify the tool produced a content type it explicitly declared.
      if (!tool.produces.includes(result.contentType)) {
        throw new TIPError(
          'EXECUTION_FAILED',
          `Tool "${tool.name}" produced undeclared content type "${result.contentType}". ` +
            `Expected one of: ${tool.produces.join(', ')}`,
          i,
          step.toolId
        );
      }

      // Verify the content type is known to the protocol.
      if (!TIP_CONTENT_TYPES.includes(result.contentType as any)) {
        throw new TIPError(
          'EXECUTION_FAILED',
          `Tool "${tool.name}" produced unknown content type "${result.contentType}".`,
          i,
          step.toolId
        );
      }

      const durationMs = Math.round(performance.now() - start);

      // Null out input immediately after tool.invoke starts/completes
      // so it can be GC'd while engineHooks are firing or if the next step is slow.
      (input as any) = null;

      // Stamp the output with producer info before passing to the next step
      current = stampBundle(result, tool.id, durationMs);

      if (!signal.aborted) {
        engineHooks.onStepComplete(i, step.toolId, durationMs);
      }
    } catch (err) {
      if (signal.aborted || (err instanceof TIPError && err.code === 'CANCELLED')) {
          throw err instanceof TIPError ? err : new TIPError('CANCELLED', 'Pipeline cancelled', i);
      }

      const tipError =
        err instanceof TIPError
          ? err
          : new TIPError('EXECUTION_FAILED', String(err), i, step.toolId);

      engineHooks.onStepError(i, step.toolId, tipError);
      throw tipError;
    }
  }

  return current!;
}
