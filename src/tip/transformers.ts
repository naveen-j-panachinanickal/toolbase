/**
 * TIP Transformer Registry
 *
 * Transformers perform automatic type coercion between content types.
 * When a pipeline step produces type A and the next tool only consumes type B,
 * the engine looks for a registered transformer from A → B before failing.
 *
 * Example use case:
 *   text/csv → application/json   (for tools that require JSON)
 *   image/jpeg → image/png        (for tools that only accept PNG)
 *
 * Transformers are pure async functions — no UI, no workers required.
 * For heavy coercions (e.g., image format conversion), a transformer can
 * offload to a worker internally, but the interface itself is always Promise-based.
 */

import type { TIPBundle, TIPContentType } from './protocol';

/** A single type-to-type coercion function */
export interface TIPTransformer {
  /** Source content type */
  from: TIPContentType;
  /** Target content type */
  to: TIPContentType;
  /**
   * Perform the coercion.
   * Must return a bundle whose contentType === this.to.
   * Must NOT modify the input bundle.
   * Must respect signal.aborted if provided.
   */
  transform: (bundle: TIPBundle, signal?: AbortSignal) => Promise<TIPBundle>;
}

/** Module-private registry — not exported directly */
const transformers: TIPTransformer[] = [];

/**
 * Register a new transformer.
 * If a transformer from→to already exists it will be appended;
 * `findTransformer` returns the first match so register-order matters.
 */
export function registerTransformer(t: TIPTransformer): void {
  transformers.push(t);
}

/**
 * Find a registered transformer between two content types.
 * Returns undefined if no transformer is registered for this pair.
 */
export function findTransformer(
  from: TIPContentType,
  to: TIPContentType
): TIPTransformer | undefined {
  return transformers.find((t) => t.from === from && t.to === to);
}

/**
 * Return true if a transformer exists from → to.
 * Used by the registry's findNextSteps() to include indirectly compatible tools.
 */
export function canTransform(from: TIPContentType, to: TIPContentType): boolean {
  return !!findTransformer(from, to);
}

/**
 * Return all currently registered transformers (read-only snapshot).
 * Useful for debugging and for the pipeline UI to show available bridges.
 */
export function getAllTransformers(): Readonly<TIPTransformer[]> {
  return transformers;
}
