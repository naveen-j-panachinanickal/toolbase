/**
 * src/lib/performance.ts
 * 
 * Simple utility to measure tool performance and notify the UI.
 */

import { getToolById } from '@/config/tools.registry';

/**
 * Utility class for measuring the execution duration of tools.
 * 
 * When stopped, it automatically identifies the execution engine 
 * (JS, Python, or WASM) and dispatches a custom event that is 
 * consumed by the PerformanceToast and PrivacyMonitor.
 */
class PerformanceTimer {
  private startTime: number | null = null;

  /** Marks the start of a performance-critical operation. */
  start() {
    this.startTime = performance.now();
  }

  /**
   * Marks the end of an operation and broadcasts results.
   * 
   * @param toolId - The unique ID of the tool being measured.
   */
  stop(toolId: string) {
    if (this.startTime === null) return;
    
    const durationMs = performance.now() - this.startTime;
    this.startTime = null;

    // Resolve engine from registry
    const tool = getToolById(toolId);
    let engine = 'JS';
    if (tool?.pythonPowered) engine = 'Python';
    else if (tool?.wasmPowered) engine = 'WASM';

    // Dispatch event for UI components (Toast + Privacy Badge)
    window.dispatchEvent(new CustomEvent('toolbase:performance-result', {
      detail: { durationMs, engine, toolId }
    }));

    // Also notify the Privacy Badge that processing is complete (if it hasn't been notified yet)
    window.dispatchEvent(new CustomEvent('toolbase:processing-complete'));
  }
}

/**
 * Factory function to create a new PerformanceTimer instance.
 * 
 * @returns {PerformanceTimer} A fresh timer instance.
 * @example
 * const timer = createTimer();
 * timer.start();
 * await doWork();
 * timer.stop('pixels/resize');
 */
export function createTimer() {
  return new PerformanceTimer();
}
