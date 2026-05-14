// src/types/pixels.ts
// TypeScript types for the Pixels image processing tool

/** Supported output image formats */
export type ImageFormat = 'jpeg' | 'png' | 'webp';

/** Resize mode when target dimensions don't match source aspect ratio */
export type ResizeMode = 'stretch' | 'contain';

/** Options for the compress operation */
export interface CompressOptions {
  /** Target quality 1–100 (lower = smaller file) */
  quality: number;
  /** Output format */
  format: ImageFormat;
  /** Scale factor applied before compression (0.1–1.0) */
  resizeFactor: number;
  /** Apply mild sharpening/contrast enhancement */
  enhance: boolean;
  /** Apply noise reduction before saving */
  denoise?: boolean;
  /** Boost color saturation */
  vibrant?: boolean;
  /** Encode at print-ready DPI */
  print_dpi?: boolean;
}

/** Options for the resize operation */
export interface ResizeOptions {
  /** Target width in pixels */
  width: number;
  /** Target height in pixels */
  height: number;
  /** Output quality 1–100 */
  quality: number;
  /** Output format */
  format: ImageFormat;
  /** How to handle aspect ratio mismatch */
  mode?: ResizeMode;
  /** Background fill colour for contain mode (hex or named colour) */
  fill_color?: string;
}

/** Basic image metadata returned by get_info */
export interface ImageInfo {
  width: number;
  height: number;
  format: string;
  mode: string;
  file_size_bytes: number;
}

/** State shape managed by usepixels */
export interface pixelsState {
  isReady: boolean;
  isProcessing: boolean;
  error: string | null;
}

/** Internal worker message types */
export type WorkerMessageType = 'READY' | 'RESULT' | 'ERROR';

/** Message structure sent from the pixels worker */
export interface pixelsWorkerMessage {
  type: WorkerMessageType;
  data?: Uint8Array | string | ImageInfo;
  error?: string;
  id?: string;
}
