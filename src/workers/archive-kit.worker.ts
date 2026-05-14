import {
  type ArchiveFormat,
  type ArchiveInputFile,
  type ZipCompressionMode,
} from "@/lib/archive-kit";
import {
  createArchiveRust,
  extractArchiveRust,
  listArchiveEntriesRust,
} from "@/lib/archive-kit-rust";

const workerSelf = self as unknown as Worker;

type WorkerCreateFile = {
  name: string;
  file: File;
};

type WorkerArchiveInput = {
  sourceName: string;
  format: ArchiveFormat;
  file: File;
};

type CreatePayload = {
  format: ArchiveFormat;
  files: WorkerCreateFile[];
  zipCompression?: ZipCompressionMode;
  deterministic?: boolean;
  password?: string;
};

type ListPayload = {
  archives: WorkerArchiveInput[];
};

type ExtractPayload = {
  archives: WorkerArchiveInput[];
  password?: string;
};

type ValidatePayload = {
  archives: WorkerArchiveInput[];
  password?: string;
};

type RequestMessage =
  | { id: string; action: "create"; payload: CreatePayload }
  | { id: string; action: "list"; payload: ListPayload }
  | { id: string; action: "extract"; payload: ExtractPayload }
  | { id: string; action: "validate"; payload: ValidatePayload };

function postProgress(id: string, progress: number, stage: string) {
  workerSelf.postMessage({ type: "progress", id, progress, stage });
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

async function readFileAsBytes(
  file: File,
  onProgress?: (loaded: number, total: number) => void
): Promise<Uint8Array> {
  const total = file.size;
  const reader = file.stream().getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && value.length > 0) {
      chunks.push(value);
      loaded += value.length;
      onProgress?.(loaded, total);
    }
  }

  if (chunks.length === 1) return chunks[0];
  const out = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  onProgress?.(total || loaded, total || loaded);
  return out;
}

async function materializeCreateFiles(
  id: string,
  files: WorkerCreateFile[],
  progressStart: number,
  progressEnd: number
): Promise<ArchiveInputFile[]> {
  let totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  if (totalSize <= 0) totalSize = files.length;
  let loadedTotal = 0;

  return Promise.all(
    files.map(async ({ name, file }) => {
      const bytes = await readFileAsBytes(file, (loaded) => {
        const approxLoaded = loadedTotal + loaded;
        const ratio = approxLoaded / totalSize;
        postProgress(id, clampProgress(progressStart + ratio * (progressEnd - progressStart)), "reading");
      });
      loadedTotal += file.size > 0 ? file.size : 1;
      return { name, bytes };
    })
  );
}

async function materializeArchives(
  id: string,
  archives: WorkerArchiveInput[],
  progressStart: number,
  progressEnd: number
): Promise<Array<{ sourceName: string; format: ArchiveFormat; bytes: Uint8Array }>> {
  let totalSize = archives.reduce((sum, archive) => sum + archive.file.size, 0);
  if (totalSize <= 0) totalSize = archives.length;
  let loadedTotal = 0;
  const out: Array<{ sourceName: string; format: ArchiveFormat; bytes: Uint8Array }> = [];

  for (const archive of archives) {
    const bytes = await readFileAsBytes(archive.file, (loaded) => {
      const approxLoaded = loadedTotal + loaded;
      const ratio = approxLoaded / totalSize;
      postProgress(id, clampProgress(progressStart + ratio * (progressEnd - progressStart)), "reading");
    });
    loadedTotal += archive.file.size > 0 ? archive.file.size : 1;
    out.push({
      sourceName: archive.sourceName,
      format: archive.format,
      bytes,
    });
  }

  return out;
}

workerSelf.onmessage = async (event: MessageEvent<RequestMessage>) => {
  const msg = event.data;
  const { id } = msg;

  try {
    postProgress(id, 10, "starting");

    if (msg.action === "create") {
      const { format, files, zipCompression, password } = msg.payload;
      const stagedFiles = await materializeCreateFiles(id, files, 8, 45);
      postProgress(id, 55, "packing");
      const bytes = await createArchiveRust(format, stagedFiles, {
        zipCompression,
        password,
      });
      postProgress(id, 100, "done");
      workerSelf.postMessage({ type: "result", id, result: bytes }, [bytes.buffer as ArrayBuffer]);
      return;
    }

    if (msg.action === "list") {
      const archives = await materializeArchives(id, msg.payload.archives, 10, 55);
      postProgress(id, 70, "indexing");
      const result = await Promise.all(
        archives.map(async (archive) => {
          const entries = await listArchiveEntriesRust(archive.format, archive.bytes);
          return entries.map((entry) => ({
            ...entry,
            sourceName: archive.sourceName,
          }));
        })
      );
      postProgress(id, 100, "done");
      workerSelf.postMessage({ type: "result", id, result: result.flat() });
      return;
    }

    if (msg.action === "extract") {
      const archives = await materializeArchives(id, msg.payload.archives, 8, 45);
      const { password } = msg.payload;
      postProgress(id, 55, "extracting");
      const extracted = await Promise.all(
        archives.map((archive) => extractArchiveRust(archive.format, archive.bytes, { password }))
      );
      postProgress(id, 100, "done");
      workerSelf.postMessage({ type: "result", id, result: extracted.flat() });
      return;
    }

    if (msg.action === "validate") {
      const archives = await materializeArchives(id, msg.payload.archives, 8, 45);
      const { password } = msg.payload;
      const reports: Array<{ sourceName: string; entries: number; ok: boolean; error?: string }> = [];
      for (let i = 0; i < archives.length; i++) {
        const archive = archives[i];
        try {
          const entries = await listArchiveEntriesRust(archive.format, archive.bytes);
          await extractArchiveRust(archive.format, archive.bytes, { password });
          reports.push({ sourceName: archive.sourceName, entries: entries.length, ok: true });
        } catch (error: unknown) {
          reports.push({
            sourceName: archive.sourceName,
            entries: 0,
            ok: false,
            error: error instanceof Error ? error.message : "Validation failed",
          });
        }
        const ratio = (i + 1) / Math.max(archives.length, 1);
        postProgress(id, clampProgress(45 + ratio * 50), "validating");
      }
      postProgress(id, 100, "done");
      workerSelf.postMessage({ type: "result", id, result: reports });
    }
  } catch (error: unknown) {
    workerSelf.postMessage({
      type: "error",
      id,
      error: error instanceof Error ? error.message : "Archive operation failed",
    });
  }
};

