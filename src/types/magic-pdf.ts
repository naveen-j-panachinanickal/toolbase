// src/types/magic-pdf.ts
// TypeScript types for the Magic PDF tool

/** Supported PDF operations */
export type PdfAction =
  | 'compress'
  | 'merge'
  | 'split'
  | 'protect'
  | 'unlock'
  | 'rotate'
  | 'to_images'
  | 'sign';

/** Options passed alongside a PDF operation */
export interface PdfOperationOptions {
  /** Target quality for compression (1–100) */
  quality?: number;
  /** Page ranges for split operations, e.g. "1-3,5" */
  pageRanges?: string;
  /** Password for protect/unlock operations */
  password?: string;
  /** Rotation angle in degrees (90, 180, 270) */
  rotateDegrees?: number;
  /** Which pages to rotate — defaults to all */
  rotatePages?: number[];
  /** Image format for to_images conversion */
  imageFormat?: 'png' | 'jpeg';
  /** DPI for to_images conversion */
  dpi?: number;
}

/** Payload sent to the Magic PDF worker */
export interface PdfWorkerPayload {
  /** Raw PDF byte data — single file operations */
  file_bytes: Uint8Array;
  /** Raw PDF byte data — multi-file operations such as merge */
  files_bytes?: Uint8Array[];
  /** Operation-specific options */
  [key: string]: unknown;
}

/** Result returned from the Magic PDF worker */
export interface PdfWorkerResult {
  /** True if the operation completed without errors */
  success: boolean;
  /** Processed PDF bytes (if operation returns a single file) */
  data?: Uint8Array;
  /** Resulting image bytes for to_images operations */
  images?: Uint8Array[];
  /** Human-readable error message (if success is false) */
  error?: string;
}

/** State shape managed by useMagicPdfWorker */
export interface MagicPdfState {
  isReady: boolean;
  isProcessing: boolean;
  error: string | null;
}
