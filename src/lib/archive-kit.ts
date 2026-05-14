export type ArchiveFormat = "zip" | "tar" | "tgz";
export type ZipCompressionMode = "store" | "fast" | "best";

export type ArchiveInputFile = {
  name: string;
  bytes: Uint8Array;
};

export type ArchiveEntry = {
  name: string;
  size: number;
  compressedSize: number;
  isDirectory: boolean;
  format: ArchiveFormat;
};

export type BatchArchiveInput = {
  sourceName: string;
  format: ArchiveFormat;
  bytes: Uint8Array;
};

export type BatchArchiveEntry = ArchiveEntry & {
  sourceName: string;
};

export type CreateArchiveOptions = {
  zipCompression?: ZipCompressionMode;
  deterministic?: boolean;
};
