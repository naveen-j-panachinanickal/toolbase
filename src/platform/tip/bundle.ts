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
 * Creates a TIPPayload from a Blob.
 *
 * @param data - The raw Blob (or File) containing the data.
 * @param contentType - The standard TIP content type for this data.
 * @param filename - The filename to associate with this payload.
 * @param extra - Optional tool-specific metadata.
 * @returns A new TIPPayload instance.
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
 * Wraps one or more payloads into a TIPBundle.
 *
 * @param payloads - Array of TIPPayloads to bundle.
 * @param contentType - Optional override for the bundle's dominant content type.
 * @returns A new TIPBundle instance.
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
 * Creates a TIPBundle from a single File.
 * 
 * This is the primary entry point for user-uploaded files or files 
 * obtained from the device's file system.
 * 
 * @param file - The file to bundle.
 * @returns A TIPBundle containing one payload.
 */
export function bundleFromFile(file: File): TIPBundle {
  const contentType: TIPContentType =
    (file.type as TIPContentType) || 'application/octet-stream';
  return createBundle([createPayload(file, contentType, file.name)]);
}

/**
 * Creates a TIPBundle from multiple Files.
 * 
 * All files are bundled together. The dominant content type is inferred 
 * from the first file in the array.
 * 
 * @param files - The array of files to bundle.
 * @returns A TIPBundle containing multiple payloads.
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
 * Extracts the single Blob from a bundle that must contain exactly one payload.
 * 
 * @param bundle - The bundle to unwrap.
 * @returns The underlying Blob data.
 * @throws {TIPError} with code 'EMPTY_BUNDLE' if bundle.payloads.length !== 1.
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
 * Stamps a bundle with producer information and execution timing.
 * 
 * This is typically called by the engine after a tool invocation succeeds.
 *
 * @param bundle - The output bundle to stamp.
 * @param producedBy - The ID of the tool that produced this bundle.
 * @param durationMs - The duration of the tool execution in milliseconds.
 * @returns A new TIPBundle with updated metadata on each payload.
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
