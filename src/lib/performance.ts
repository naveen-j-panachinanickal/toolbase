/**
 * src/lib/performance.ts
 * 
 * Simple utility to measure tool performance and notify the UI.
 */

import { getToolById } from '@/config/tools.registry';

class PerformanceTimer {
  private startTime: number | null = null;

  start() {
    this.startTime = performance.now();
  }

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
 * Creates a new timer instance.
 * 
 * Usage:
 *   const timer = createTimer();
 *   timer.start();
 *   await work();
 *   timer.stop('tool-id');
 */
export function createTimer() {
  return new PerformanceTimer();
}
