/** Supported archive formats. */
export type ArchiveFormat = "zip" | "tar" | "tgz";

/** Compression levels for ZIP archives. */
export type ZipCompressionMode = "store" | "fast" | "best";

/** Represents a file to be included in an archive. */
export type ArchiveInputFile = {
  /** Relative path within the archive. */
  name: string;
  /** Binary content of the file. */
  bytes: Uint8Array;
};

/** Metadata for a single entry within an archive. */
export type ArchiveEntry = {
  /** Full path of the entry. */
  name: string;
  /** Uncompressed size in bytes. */
  size: number;
  /** Compressed size in bytes. */
  compressedSize: number;
  /** Whether the entry represents a directory. */
  isDirectory: boolean;
  /** The format of the parent archive. */
  format: ArchiveFormat;
};

/** Input for batch archive processing (e.g., extracting multiple archives). */
export type BatchArchiveInput = {
  /** Identifier for the source archive. */
  sourceName: string;
  /** Format of the source archive. */
  format: ArchiveFormat;
  /** Binary content of the archive. */
  bytes: Uint8Array;
};

/** Metadata for an entry processed in a batch operation. */
export type BatchArchiveEntry = ArchiveEntry & {
  /** The name of the source archive this entry belongs to. */
  sourceName: string;
};

/** Options for creating new archives. */
export type CreateArchiveOptions = {
  /** Compression mode for ZIP (ignored for TAR). */
  zipCompression?: ZipCompressionMode;
  /** Whether to strip timestamps for bit-identical output. */
  deterministic?: boolean;
};
