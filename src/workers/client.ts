/**
 * Generic Worker Client
 *
 * Replaces all bespoke bridge files (magic-pdf-bridge.ts, pixels-bridge.ts, etc).
 * Manages the lifecycle of a Web Worker (initialization, message passing, error handling).
 *
 * Worker message protocol:
 *   → { type: 'EXECUTE', action: string, data: object, id: string }
 *   ← { type: 'RESULT', data: any, id: string }
 *   ← { type: 'ERROR', error: string, id: string }
 *   ← { type: 'READY' }              (on startup)
 *   ← { type: 'INIT_PROGRESS', message: string }  (during WASM boot)
 */

export interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

/** Coarse-grained readiness states for a WASM-backed worker. */
export type WorkerReadyState = 'cold' | 'warming' | 'ready';

export class WorkerClient {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private pending = new Map<string, PendingRequest>();

  /** Current warm-up state — observable by the UI. */
  readyState: WorkerReadyState = 'cold';

  /** Optional callback fired whenever readyState changes. */
  onReadyStateChange?: (state: WorkerReadyState, message?: string) => void;

  /**
   * @param createWorker A factory function that returns a new Web Worker instance.
   *                     e.g. () => new Worker(new URL('../workers/magic-pdf.worker.ts', import.meta.url))
   * @param workerName   A human-readable name for logging and error messages.
   */
  constructor(
    private createWorker: () => Worker,
    private workerName: string
  ) {}

  private setReadyState(state: WorkerReadyState, message?: string): void {
    this.readyState = state;
    this.onReadyStateChange?.(state, message);
  }

  /** Lazily boot the worker. Safe to call multiple times — returns the same promise. */
  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.setReadyState('warming');

    this.initPromise = new Promise((resolve, reject) => {
      try {
        this.worker = this.createWorker();

        this.worker.onmessage = (event: MessageEvent) => {
          const { type, data, id, error, message } = event.data as {
            type: 'READY' | 'RESULT' | 'ERROR' | 'INIT_PROGRESS';
            data?: unknown;
            id?: string;
            error?: string;
            message?: string;
          };

          if (type === 'INIT_PROGRESS') {
            // Relay granular warm-up progress to any UI subscriber
            this.onReadyStateChange?.('warming', message);
            return;
          }

          if (type === 'READY') {
            this.setReadyState('ready');
            resolve();
            return;
          }

          if (!id) return;
          const req = this.pending.get(id);
          if (!req) return;
          this.pending.delete(id);

          if (type === 'RESULT') {
            req.resolve(data);
          } else {
            req.reject(new Error(error ?? `${this.workerName} worker error`));
          }
        };

        this.worker.onerror = (err) => {
          // Reject all pending on crash
          for (const req of this.pending.values()) {
            req.reject(new Error(`${this.workerName} worker crashed`));
          }
          this.pending.clear();
          this.setReadyState('cold');
          reject(new Error(err.message ?? `Failed to start ${this.workerName} worker`));
        };
      } catch (err) {
        this.setReadyState('cold');
        reject(err);
      }
    });

    return this.initPromise;
  }

  /**
   * Execute an action on the worker.
   * Automatically initializes the worker on first call.
   *
   * @param action   - Python-side action name (e.g. 'compress', 'to_images')
   * @param payload  - Data sent to the worker, translated to Python kwargs
   * @param transfer - Optional array of Transferable objects to transfer ownership
   * @param signal   - Optional AbortSignal to cancel waiting for the worker result
   */
  async execute(
    action: string,
    payload: Record<string, unknown>,
    transfer?: Transferable[],
    signal?: AbortSignal
  ): Promise<unknown> {
    if (signal?.aborted) throw new Error('CANCELLED');

    await this.init();

    if (!this.worker) throw new Error(`${this.workerName} worker unavailable`);

    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();

      const onAbort = () => {
        this.pending.delete(id);
        reject(new Error('CANCELLED'));
      };

      if (signal) signal.addEventListener('abort', onAbort, { once: true });

      this.pending.set(id, {
        resolve: (val) => {
          if (signal) signal.removeEventListener('abort', onAbort);
          resolve(val);
        },
        reject: (err) => {
          if (signal) signal.removeEventListener('abort', onAbort);
          reject(err);
        },
      });

      this.worker!.postMessage({ type: 'EXECUTE', action, data: payload, id }, transfer || []);
    });
  }
}
