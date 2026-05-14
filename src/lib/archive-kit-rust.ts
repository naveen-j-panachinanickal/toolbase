import type {
  ArchiveEntry,
  ArchiveFormat,
  ArchiveInputFile,
  ZipCompressionMode,
} from "@/lib/archive-kit";

type ArchiveKitRustApi = {
  default: (wasmUrl?: string | URL | Request) => Promise<unknown>;
  create_archive_json: (format: string, filesJson: string, options_json?: string) => string;
  list_archive_json: (format: string, archiveBytesB64: string) => string;
  extract_archive_json: (format: string, archiveBytesB64: string, options_json?: string) => string;
  create_archive_v2: (
    format: string,
    names: string[],
    all_bytes: Uint8Array,
    byte_offsets: Uint32Array,
    options_json?: string
  ) => Uint8Array;
  list_archive_v2: (format: string, bytes: Uint8Array) => string;
  extract_archive_v2: (format: string, bytes: Uint8Array, options_json?: string) => any;
};

let rustApiPromise: Promise<ArchiveKitRustApi> | null = null;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...sub);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function getRuntimeBaseUrl(): string {
  const locationLike = globalThis.location;
  if (!locationLike) {
    // If and when running in Worker without location, we might need a fallback or passed URL
    return "";
  }
  return locationLike.origin || "";
}

async function loadRustApi(): Promise<ArchiveKitRustApi> {
  if (!rustApiPromise) {
    rustApiPromise = (async () => {
      const base = getRuntimeBaseUrl();
      const jsUrl = `${base}/wasm/archive-kit/pkg/archive_kit.js`;
      const wasmUrl = `${base}/wasm/archive-kit/pkg/archive_kit_bg.wasm`;
      const mod = (await import(/* webpackIgnore: true */ jsUrl)) as ArchiveKitRustApi;
      await mod.default(wasmUrl);
      return mod;
    })();
  }
  return rustApiPromise;
}

export async function isArchiveKitRustAvailable(): Promise<boolean> {
  try {
    await loadRustApi();
    return true;
  } catch {
    return false;
  }
}

export async function createArchiveRust(
  format: ArchiveFormat,
  files: ArchiveInputFile[],
  options: { zipCompression?: ZipCompressionMode; password?: string } = {}
): Promise<Uint8Array> {
  const api = await loadRustApi();

  // Optimization: use v2 binary interface to avoid Base64 conversion
  const names = files.map((f) => f.name);
  const totalSize = files.reduce((sum, f) => sum + f.bytes.length, 0);
  const allBytes = new Uint8Array(totalSize);
  const offsets = new Uint32Array(files.length);
  let currentOffset = 0;
  for (let i = 0; i < files.length; i++) {
    allBytes.set(files[i].bytes, currentOffset);
    currentOffset += files[i].bytes.length;
    offsets[i] = currentOffset;
  }

  return api.create_archive_v2(
    format,
    names,
    allBytes,
    offsets,
    JSON.stringify({
      zip_compression: options.zipCompression ?? "store",
      password: options.password ?? null,
    })
  );
}

export async function listArchiveEntriesRust(
  format: ArchiveFormat,
  bytes: Uint8Array
): Promise<ArchiveEntry[]> {
  const api = await loadRustApi();

  const out = api.list_archive_v2(format, bytes);
  const parsed = JSON.parse(out) as Array<{
    name: string;
    size: number;
    compressed_size: number;
    is_directory: boolean;
    format: string;
  }>;

  return parsed.map((e) => ({
    name: e.name,
    size: e.size,
    compressedSize: e.compressed_size,
    isDirectory: e.is_directory,
    format: (e.format === "tar" ? "tar" : "zip") as ArchiveFormat,
  }));
}

export async function extractArchiveRust(
  format: ArchiveFormat,
  bytes: Uint8Array,
  options: { password?: string } = {}
): Promise<ArchiveInputFile[]> {
  const api = await loadRustApi();

  const out = api.extract_archive_v2(
    format,
    bytes,
    JSON.stringify({
      password: options.password ?? null,
    })
  );
  
  // extract_archive_v2 returns the JSON string directly or as any
  const parsed = (typeof out === "string" ? JSON.parse(out) : out) as Array<{ name: string; bytes_b64: string }>;

  return parsed.map((file) => ({
    name: file.name,
    bytes: fromBase64(file.bytes_b64),
  }));
}

