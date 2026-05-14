import { WorkerClient } from './client';

/**
 * Singleton definitions for Toolbase Workers.
 *
 * Using lazy Worker factories `() => new Worker(url)` guarantees:
 * 1. Workers aren't spawned until actually requested by `execute()`
 * 2. Next.js doesn't try to execute WebWorker syntax on the Server (SSR)
 */

export const magicPdfWorker = new WorkerClient(
  () => new Worker(new URL('./magic-pdf.worker.ts', import.meta.url)),
  'Magic PDF'
);

export const pixelsWorker = new WorkerClient(
  () => new Worker(new URL('./pixels.worker.ts', import.meta.url)),
  'Pixels'
);

export const dataLensWorker = new WorkerClient(
  () => new Worker(new URL('./data-lens.worker.ts', import.meta.url)),
  'Data Lens'
);

export const openDrawWorker = new WorkerClient(
  () => new Worker(new URL('./open-draw.worker.ts', import.meta.url)),
  'Open Draw'
);

export const base64Worker = new WorkerClient(
  () => new Worker(new URL('./base64.worker.ts', import.meta.url)),
  'Base64'
);

export const redactSecretsWorker = new WorkerClient(
  () => new Worker(new URL('./redact.worker.ts', import.meta.url)),
  'Redact Secrets'
);

export const qrForgeWorker = new WorkerClient(
  () => new Worker(new URL('./qr-forge.worker.ts', import.meta.url)),
  'QR Forge'
);

// ─── Tool → Worker mapping ────────────────────────────────────────────────────

/**
 * Returns the WorkerClient that backs a given TIP tool ID.
 * Used by the pipeline canvas to trigger node-aware pre-warming:
 * the moment a user drops a node, the relevant WASM runtime starts booting.
 *
 * @param toolId - e.g. 'magic-pdf/compress', 'pixels/resize'
 * @returns The WorkerClient for that tool, or null if no Pyodide worker is needed.
 */
export function workerForTool(toolId: string): WorkerClient | null {
  if (toolId.startsWith('magic-pdf')) return magicPdfWorker;
  if (toolId.startsWith('pixels')) return pixelsWorker;
  if (toolId.startsWith('data-lens')) return dataLensWorker;
  if (toolId.startsWith('open-draw')) return openDrawWorker;
  if (toolId.startsWith('redact-secrets')) return redactSecretsWorker;
  if (toolId.startsWith('base64')) return base64Worker;
  if (toolId.startsWith('qr-forge')) return qrForgeWorker;
  return null;
}

// ─── Idle Pre-Warm ────────────────────────────────────────────────────────────

// Background pre-warming is disabled on the home page to maximize TBT/LCP performance.
// Workers will initialize lazily when a tool is actually opened or a node is added to the pipeline.


import { useEffect, useState } from 'react';

/**
 * Returns true if ANY active Python worker is currently in the 'warming' state.
 * Useful for disabling global UI actions (like saving) during boot.
 */
export function useAnyWorkerWarming(): boolean {
  const allWorkers = [magicPdfWorker, pixelsWorker, dataLensWorker, openDrawWorker, base64Worker, redactSecretsWorker, qrForgeWorker];
  
  const checkWarming = () => allWorkers.some(w => w.readyState === 'warming');
  const [isWarming, setIsWarming] = useState(checkWarming);

  useEffect(() => {
    // Initial check
    setIsWarming(checkWarming());

    // Subscription cleanup functions
    const cleanups = allWorkers.map(worker => {
      const prevCallback = worker.onReadyStateChange;
      worker.onReadyStateChange = (state, msg) => {
        setIsWarming(checkWarming());
        prevCallback?.(state, msg);
      };

      return () => {
        if (worker.onReadyStateChange !== prevCallback) {
            // Restore exact previous callback avoiding memory leak chain
            worker.onReadyStateChange = prevCallback;
        }
      };
    });

    return () => cleanups.forEach(clean => clean());
  }, []);

  return isWarming;
}
