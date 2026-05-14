'use client';

/**
 * usePipelineEngine — React hook that wraps executeTIPPipeline.
 *
 * Connects the pure TIPEngine to React state so the Pipeline Builder UI
 * can observe real-time execution progress for every step.
 *
 * Usage:
 *   const { state, run, cancel, reset } = usePipelineEngine();
 *   await run(pipeline.steps, file);   // kicks off the pipeline
 *   state.status                       // 'idle' | 'running' | 'complete' | 'error'
 *   state.steps[i].progress            // 0–100 per step
 *   state.output                       // TIPBundle when complete
 */

import { useCallback, useRef, useState } from 'react';
import { executeTIPPipeline } from '@/tip/engine';
import { bundleFromFile, bundleFromFiles } from '@/tip/bundle';
import type { TIPBundle } from '@/tip/protocol';
import type { TIPPipelineStep } from '@/tip/engine';
import { TIPError } from '@/tip/errors';
import type { PipelineEngineState, StepState, PipelineStep } from '@/types/pipeline';
import type { Node } from '@xyflow/react';

// ─── Extended state with output ───────────────────────────────────────────────

interface UsePipelineEngineReturn {
  state: PipelineEngineState;
  /** The final TIPBundle produced after successful completion */
  output: TIPBundle | null;
  /**
   * Start the pipeline.
   * @param steps   - Ordered pipeline steps
   * @param file    - The file from the FileInputNode (used as the initial bundle)
   */
  run: (steps: PipelineStep[], file: File) => Promise<void>;
  /** Abort the running pipeline (honours AbortSignal in each TIPTool) */
  cancel: () => void;
  /** Reset to idle state (clears output and error) */
  reset: () => void;
}

// ─── Initial state factory ────────────────────────────────────────────────────

function makeInitialStepStates(count: number): StepState[] {
  return Array.from({ length: count }, () => ({
    status: 'idle' as const,
    progress: 0,
    message: '',
    durationMs: 0,
    error: null,
  }));
}

const IDLE_STATE: PipelineEngineState = {
  status: 'idle',
  currentStepIndex: -1,
  steps: [],
  error: null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePipelineEngine(): UsePipelineEngineReturn & { isPaused: boolean; pause: () => void; resume: () => void } {
  const [state, setState] = useState<PipelineEngineState>(IDLE_STATE);
  const [output, setOutput] = useState<TIPBundle | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  
  const isPausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const resumeResolverRef = useRef<(() => void) | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const updateStep = useCallback(
    (index: number, patch: Partial<StepState>) => {
      setState((prev) => {
        const steps = [...prev.steps];
        steps[index] = { ...steps[index], ...patch };
        return { ...prev, steps };
      });
    },
    []
  );

  // ── run ───────────────────────────────────────────────────────────────────────

  const run = useCallback(
    async (steps: PipelineStep[], file: File) => {
      // Cancel any in-flight run
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      // Reset pause state
      isPausedRef.current = false;
      setIsPaused(false);
      resumeResolverRef.current = null;

      // Seed initial state
      const stepStates = makeInitialStepStates(steps.length);
      setState({
        status: 'running',
        currentStepIndex: 0,
        steps: stepStates,
        error: null,
      });
      setOutput(null);

      // Build the initial bundle from the FileInputNode file
      const initialBundle = bundleFromFile(file);

      // Map PipelineStep (UI type) → TIPPipelineStep (engine type)
      const engineSteps: TIPPipelineStep[] = steps.map((s) => ({
        toolId: s.toolId,
        config: s.config,
      }));

      try {
        const result = await executeTIPPipeline(
          engineSteps,
          initialBundle,
          {
            onStepStart: (i, _toolId) => {
              if (controller.signal.aborted) return;
              setState((prev) => {
                if (prev.status === 'paused') return prev; // Don't override pause
                return {
                  ...prev,
                  currentStepIndex: i,
                  steps: prev.steps.map((s, idx) =>
                    idx === i ? { ...s, status: 'running', progress: 0 } : s
                  ),
                };
              });
            },

            onStepProgress: (i, percent, message) => {
              if (controller.signal.aborted) return;
              setState((prev) => {
                const steps = [...prev.steps];
                if (steps[i].status === 'paused') return prev; // Don't override step pause
                steps[i] = { ...steps[i], progress: percent, message: message ?? '' };
                return { ...prev, steps };
              });
            },

            onStepComplete: (i, _toolId, durationMs) => {
              if (controller.signal.aborted) return;
              updateStep(i, {
                status: 'complete',
                progress: 100,
                durationMs,
                error: null,
              });
            },

            onStepError: (i, _toolId, error) => {
              if (controller.signal.aborted) return;
              updateStep(i, {
                status: 'error',
                error: error.message,
              });
            },
          },
          controller.signal,
          async (i) => {
            // Aggressive Pause Check
            if (isPausedRef.current) {
              setState((prev) => ({
                ...prev,
                status: 'paused',
                steps: prev.steps.map((s, idx) =>
                  idx === i ? { ...s, status: 'paused' } : s
                ),
              }));

              await new Promise<void>((resolve) => {
                resumeResolverRef.current = resolve;
              });
            }
          }
        );

        if (controller.signal.aborted) return;

        setOutput(result);
        setState((prev) => ({ ...prev, status: 'complete', error: null }));
      } catch (err) {
        if (controller.signal.aborted) return;
        
        const tipError = err as TIPError;
        const isCancelled = tipError?.code === 'CANCELLED';

        setState((prev) => ({
          ...prev,
          status: isCancelled ? 'cancelled' : 'error',
          steps: prev.steps.map((s) =>
            s.status === 'running' ? { ...s, status: isCancelled ? 'idle' : 'error' } : s
          ),
          error: isCancelled ? null : (tipError?.message ?? 'Pipeline failed'),
        }));
      }
    },
    [updateStep]
  );

  // ── pause/resume ─────────────────────────────────────────────────────────────

  const pause = useCallback(() => {
    if (state.status !== 'running') return;
    isPausedRef.current = true;
    setIsPaused(true);
    setState(prev => ({ ...prev, status: 'paused' }));
  }, [state.status]);

  const resume = useCallback(() => {
    if (state.status !== 'paused') return;
    isPausedRef.current = false;
    setIsPaused(false);
    setState(prev => ({ ...prev, status: 'running' }));
    if (resumeResolverRef.current) {
      resumeResolverRef.current();
      resumeResolverRef.current = null;
    }
  }, [state.status]);

  // ── cancel ────────────────────────────────────────────────────────────────────

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    setIsPaused(false);
    isPausedRef.current = false;
    if (resumeResolverRef.current) {
        resumeResolverRef.current();
        resumeResolverRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      status: 'cancelled',
      steps: prev.steps.map((s) =>
        s.status === 'running' ? { ...s, status: 'idle' } : s
      ),
      error: null,
    }));
  }, []);

  // ── reset ─────────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsPaused(false);
    isPausedRef.current = false;
    setState(IDLE_STATE);
    setOutput(null);
  }, []);

  return { state, output, run, cancel, reset, isPaused, pause, resume };
}
