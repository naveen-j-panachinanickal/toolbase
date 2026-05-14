/**
 * TIP Bundle Helpers
 *
 * Convenience functions for creating, wrapping, and transforming TIPBundles.
 * These are the primary constructors tool implementers and the engine will use.
 * All functions are pure — no side effects, no I/O.
 */

import { TIP_VERSION } from './version';
import type { TIPBundle, TIPContentType, TIPPayload } from './protocol';
import { TIPError } from './errors';

/**
 * Create a TIPPayload from a Blob.
 *
 * @param data       - The raw Blob (or File, which extends Blob)
 * @param contentType - The TIP content type for this data
 * @param filename    - Original or derived filename (shown in UI, used for downloads)
 * @param extra       - Optional tool-specific metadata stored in payload.meta.extra
 */
export function createPayload(
  data: Blob,
  contentType: TIPContentType,
  filename: string,
  extra?: Record<string, unknown>
): TIPPayload {
  return {
    contentType,
    data,
    meta: {
      filename,
      sizeBytes: data.size,
      mimeType: data.type || contentType,
      tipVersion: TIP_VERSION,
      extra,
    },
  };
}

/**
 * Wrap one or more payloads into a TIPBundle.
 *
 * @param payloads    - Array of TIPPayloads to bundle (must be non-empty)
 * @param contentType - Override the dominant content type.
 *                      Defaults to the first payload's contentType.
 */
export function createBundle(
  payloads: TIPPayload[],
  contentType?: TIPContentType
): TIPBundle {
  const dominant: TIPContentType =
    contentType ?? payloads[0]?.contentType ?? 'application/octet-stream';

  return {
    payloads,
    contentType: dominant,
    meta: {
      count: payloads.length,
      totalSizeBytes: payloads.reduce((sum, p) => sum + p.meta.sizeBytes, 0),
      tipVersion: TIP_VERSION,
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Create a TIPBundle from a single File (e.g., from a file input or drop zone).
 * This is the primary entry point for user-uploaded files.
 */
export function bundleFromFile(file: File): TIPBundle {
  const contentType: TIPContentType =
    (file.type as TIPContentType) || 'application/octet-stream';
  return createBundle([createPayload(file, contentType, file.name)]);
}

/**
 * Create a TIPBundle from multiple Files.
 * All files are bundled together; the dominant type is inferred from the first file.
 */
export function bundleFromFiles(files: File[]): TIPBundle {
  const payloads = files.map((f) =>
    createPayload(
      f,
      (f.type as TIPContentType) || 'application/octet-stream',
      f.name
    )
  );
  return createBundle(payloads);
}

/**
 * Extract the single Blob from a bundle that must contain exactly one payload.
 * Throws if the bundle has zero or more than one payload.
 *
 * @throws TIPError with code 'EMPTY_BUNDLE' if bundle.payloads.length !== 1
 */
export function unwrapSingle(bundle: TIPBundle): Blob {
  if (bundle.payloads.length !== 1) {
    throw new TIPError(
      'EMPTY_BUNDLE',
      `Expected single payload, got ${bundle.payloads.length}`
    );
  }
  return bundle.payloads[0].data;
}

/**
 * Stamp a bundle with producer info and timing after successful invocation.
 * Called by the engine — tool implementers do NOT need to call this.
 *
 * @param bundle     - The output bundle returned by tool.invoke()
 * @param producedBy - The tool.id that created this bundle
 * @param durationMs - Wall-clock time of the tool.invoke() call
 */
export function stampBundle(
  bundle: TIPBundle,
  producedBy: string,
  durationMs: number
): TIPBundle {
  return {
    ...bundle,
    payloads: bundle.payloads.map((p) => ({
      ...p,
      meta: { ...p.meta, producedBy, durationMs },
    })),
  };
}
