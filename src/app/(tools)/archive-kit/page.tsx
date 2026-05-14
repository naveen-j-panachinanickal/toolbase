"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ToolSidebar, ToolSidebarItem } from "@/components/ui/ToolSidebar";
import { cn } from "@/lib/utils";
import {
  Archive,
  Ban,
  CheckCircle2,
  Download,
  FolderTree,
  Info,
  PackageOpen,
  ShieldCheck,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  ArchiveEntry,
  ArchiveFormat,
  ArchiveInputFile,
  ZipCompressionMode,
} from "@/lib/archive-kit";
import {
  createArchiveRust,
  extractArchiveRust,
} from "@/lib/archive-kit-rust";
import { useArchiveKitWorker } from "@/hooks/useArchiveKitWorker";

function bytesToHuman(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function inferFormatFromName(name: string): ArchiveFormat | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".zip")) return "zip";
  if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) return "tgz";
  if (lower.endsWith(".tar")) return "tar";
  return null;
}

function downloadBytes(filename: string, bytes: Uint8Array, mime: string) {
  const blob = new Blob([Uint8Array.from(bytes)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type SelectedInputFile = {
  file: File;
  path: string;
  selected?: boolean;
};

type TreeNode = {
  name: string;
  fullPath: string;
  isFile: boolean;
  children: Map<string, TreeNode>;
};

function buildPathTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "root", fullPath: "", isFile: false, children: new Map() };
  for (const rawPath of paths) {
    const parts = rawPath.split("/").filter(Boolean);
    let current = root;
    let composed = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      composed = composed ? `${composed}/${part}` : part;
      const isFile = i === parts.length - 1;
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          fullPath: composed,
          isFile,
          children: new Map(),
        });
      }
      current = current.children.get(part)!;
      current.isFile = isFile;
    }
  }
  return root;
}

function renderTree(node: TreeNode, depth = 0): React.ReactNode[] {
  const children = Array.from(node.children.values()).sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  return children.flatMap((child) => {
    const row = (
      <div
        key={child.fullPath}
        className="text-xs text-gray-700"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        {child.isFile ? "• " : "▸ "} {child.name}
      </div>
    );
    if (child.isFile) return [row];
    return [row, ...renderTree(child, depth + 1)];
  });
}

function isLikelyTextFile(path: string): boolean {
  const lower = path.toLowerCase();
  const textExtensions = [
    ".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".csv", ".ts", ".tsx", ".js", ".jsx",
    ".html", ".css", ".scss", ".py", ".rs", ".toml", ".env", ".log", ".ini", ".sql",
  ];
  return textExtensions.some((ext) => lower.endsWith(ext));
}

async function readFileAsBytesStreaming(file: File): Promise<Uint8Array> {
  const reader = file.stream().getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && value.length > 0) {
      chunks.push(value);
      total += value.length;
    }
  }
  if (chunks.length === 1) return chunks[0];
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

type TelemetryEvent = {
  at: string;
  op: "create" | "inspect" | "extract" | "validate";
  format: string;
  inputBytes: number;
  outputBytes: number;
  ms: number;
  ratio?: number;
};

const TELEMETRY_KEY = "archive-kit:telemetry";

function readTelemetry(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TelemetryEvent[];
  } catch {
    return [];
  }
}

function writeTelemetry(events: TelemetryEvent[]) {
  try {
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(events.slice(-100)));
  } catch {
    // ignore
  }
}

export default function ArchiveKitPage() {
  const sections: ToolSidebarItem[] = useMemo(
    () => [
      { id: "create", label: "Create Archive", icon: Archive },
      { id: "inspect", label: "Inspect Archive", icon: FolderTree },
      { id: "extract", label: "Extract Archive", icon: PackageOpen },
    ],
    []
  );

  const [activeSection, setActiveSection] = useState<"create" | "inspect" | "extract">("create");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const activeLabel = sections.find((s) => s.id === activeSection)?.label || "Archive Kit";

  const [createFiles, setCreateFiles] = useState<SelectedInputFile[]>([]);
  const [createFormat, setCreateFormat] = useState<ArchiveFormat>("zip");
  const [zipCompression, setZipCompression] = useState<ZipCompressionMode>("store");
  const [deterministic, setDeterministic] = useState(false);
  const [outputName, setOutputName] = useState("archive.zip");
  const [zipPassword, setZipPassword] = useState("");
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const { run, cancel, isBusy, progress } = useArchiveKitWorker();

  const [inspectFormat, setInspectFormat] = useState<ArchiveFormat>("zip");
  const [inspectFiles, setInspectFiles] = useState<File[]>([]);
  const [inspectEntries, setInspectEntries] = useState<ArchiveEntry[]>([]);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspectStatus, setInspectStatus] = useState<string | null>(null);
  const [inspectQuery, setInspectQuery] = useState("");
  const [inspectPassword, setInspectPassword] = useState("");
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string>("");
  const [previewKind, setPreviewKind] = useState<"text" | "json" | "xml" | "csv" | "image">("text");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedEntryNames, setSelectedEntryNames] = useState<Set<string>>(new Set());

  const [extractFormat, setExtractFormat] = useState<ArchiveFormat>("zip");
  const [extractFiles, setExtractFiles] = useState<File[]>([]);
  const [extracted, setExtracted] = useState<ArchiveInputFile[]>([]);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractStatus, setExtractStatus] = useState<string | null>(null);
  const [extractPassword, setExtractPassword] = useState("");
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>([]);
  const [queueEnabled, setQueueEnabled] = useState(false);
  const engineLabel = "Rust WASM";
  const [jobs, setJobs] = useState<Array<{
    id: string;
    label: string;
    status: "pending" | "running" | "success" | "failed";
    attempts: number;
    error?: string;
  }>>([]);
  const jobTaskRef = React.useRef<Map<string, () => Promise<void>>>(new Map());
  const processingRef = React.useRef(false);
  const jobsRef = React.useRef(jobs);


  React.useEffect(() => {
    setTelemetry(readTelemetry());
  }, []);

  React.useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  React.useEffect(() => {
    return () => {
      if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    };
  }, [previewImageUrl]);

  const recordTelemetry = (event: TelemetryEvent) => {
    if (!telemetryEnabled) return;
    const next = [...telemetry, event].slice(-100);
    setTelemetry(next);
    writeTelemetry(next);
  };

  const processQueue = React.useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      while (true) {
        const next = jobsRef.current.find((j) => j.status === "pending");
        if (!next) break;
        setJobs((prev) =>
          prev.map((j) => (j.id === next.id ? { ...j, status: "running", attempts: j.attempts + 1, error: undefined } : j))
        );
        const task = jobTaskRef.current.get(next.id);
        if (!task) {
          setJobs((prev) =>
            prev.map((j) => (j.id === next.id ? { ...j, status: "failed", error: "Missing job task." } : j))
          );
          continue;
        }
        try {
          await task();
          setJobs((prev) => prev.map((j) => (j.id === next.id ? { ...j, status: "success" } : j)));
        } catch (error: unknown) {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === next.id
                ? { ...j, status: "failed", error: error instanceof Error ? error.message : "Job failed." }
                : j
            )
          );
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, []);

  const runMaybeQueued = async (label: string, task: () => Promise<void>) => {
    if (!queueEnabled) {
      await task();
      return;
    }
    const id = crypto.randomUUID();
    jobTaskRef.current.set(id, task);
    setJobs((prev) => [...prev, { id, label, status: "pending", attempts: 0 }]);
    setTimeout(() => {
      processQueue();
    }, 0);
  };

  const appendSelectedFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming: SelectedInputFile[] = Array.from(files).map((file) => {
      const maybeRelative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
      const path = maybeRelative && maybeRelative.trim().length > 0 ? maybeRelative : file.name;
      return { file, path: path.replace(/\\/g, "/"), selected: true };
    });

    setCreateFiles((prev) => {
      const map = new Map<string, SelectedInputFile>();
      for (const existing of prev) {
        map.set(`${existing.path}:${existing.file.size}:${existing.file.lastModified}`, existing);
      }
      for (const item of incoming) {
        map.set(`${item.path}:${item.file.size}:${item.file.lastModified}`, item);
      }
      return Array.from(map.values());
    });
  };

  const updateCreatePath = (index: number, nextPath: string) => {
    setCreateFiles((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, path: nextPath.replace(/\\/g, "/") || item.path } : item
      )
    );
  };

  const removeCreateFile = (index: number) => {
    setCreateFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateArchive = async () => runMaybeQueued("Create archive", async () => {
    setCreateError(null);
    setCreateStatus(null);
    try {
      const started = performance.now();
      if (createFiles.length === 0) throw new Error("Add at least one input file.");
      const archive = await run<Uint8Array>("create", {
        format: createFormat,
        files: createFiles.map(({ file, path }) => ({ file, name: path })),
        zipCompression,
        deterministic,
        password: zipPassword.trim() || undefined,
      });
      const safeName = outputName.trim() || `archive.${createFormat}`;
      const filename = safeName.endsWith(`.${createFormat}`) ? safeName : `${safeName}.${createFormat}`;
      downloadBytes(
        filename,
        archive,
        createFormat === "zip" ? "application/zip" : "application/x-tar"
      );
      setCreateStatus(`Created ${filename} (${bytesToHuman(archive.length)}).`);
      recordTelemetry({
        at: new Date().toISOString(),
        op: "create",
        format: createFormat,
        inputBytes: createFiles.reduce((acc, item) => acc + item.file.size, 0),
        outputBytes: archive.length,
        ms: Math.round(performance.now() - started),
        ratio: createFiles.reduce((acc, item) => acc + item.file.size, 0)
          ? archive.length / createFiles.reduce((acc, item) => acc + item.file.size, 0)
          : undefined,
      });
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Archive creation failed.");
    }
  });

  const handleDownloadAllExtracted = async () => {
    try {
      if (extracted.length === 0) return;
      const archive = await createArchiveRust("zip", extracted, { zipCompression });
      const base = (extractFiles[0]?.name || "extracted").replace(/\.(zip|tar|tgz|tar\.gz)$/i, "");
      downloadBytes(`${base}-extracted.zip`, archive, "application/zip");
    } catch (err: unknown) {
      setExtractError(err instanceof Error ? err.message : "Unable to package extracted files.");
    }
  };

  const handleInspectArchive = async () => runMaybeQueued("Inspect archives", async () => {
    setInspectError(null);
    setInspectStatus(null);
    try {
      const started = performance.now();
      if (inspectFiles.length === 0) throw new Error("Select one or more archives to inspect.");

      let entries: ArchiveEntry[] = [];
      const archives = inspectFiles.map((file) => ({
        sourceName: file.name,
        format: inferFormatFromName(file.name) ?? inspectFormat,
        file,
      }));
      const combined = await run<Array<ArchiveEntry & { sourceName: string }>>("list", { archives });
      entries = inspectFiles.length === 1
        ? combined.map((entry) => ({
            name: entry.name,
            size: entry.size,
            compressedSize: entry.compressedSize,
            isDirectory: entry.isDirectory,
            format: entry.format,
          }))
        : combined.map((entry) => ({
          ...entry,
          name: `${entry.sourceName} :: ${entry.name}`,
        }));
      setInspectEntries(entries);
      setSelectedEntryNames(new Set());
      setInspectStatus(`Loaded ${entries.length} entries.`);
      
      // Auto-validate for basic security
      const suspicious = entries.filter((e) => /(^\/|^\.\.|\/\.\.\/|\\\.\.\\)/.test(e.name));
      if (suspicious.length > 0) {
        setInspectError(`Caution: ${suspicious.length} entries have suspicious paths (potential ZipSlip).`);
      }
      
      recordTelemetry({
        at: new Date().toISOString(),
        op: "inspect",
        format: inspectFiles.length === 1 ? (inferFormatFromName(inspectFiles[0].name) ?? inspectFormat) : "mixed",
        inputBytes: inspectFiles.reduce((a, b) => a + b.size, 0),
        outputBytes: entries.length,
        ms: Math.round(performance.now() - started),
      });
    } catch (err: unknown) {
      setInspectEntries([]);
      const isPwdError = err instanceof Error && (err.message.includes("password") || err.message.includes("decrypt"));
      setInspectError(isPwdError ? "This archive is password protected. Please provide the correct password above." : (err instanceof Error ? err.message : "Inspection failed."));
    }
  });

  const handleValidateInspectArchive = async () => runMaybeQueued("Validate archives", async () => {
    setInspectError(null);
    setInspectStatus(null);
    try {
      const started = performance.now();
      if (inspectFiles.length === 0) throw new Error("Select one or more archives to validate.");
      const archives = inspectFiles.map((file) => ({
        sourceName: file.name,
        format: inferFormatFromName(file.name) ?? inspectFormat,
        file,
      }));
      const reports = await run<Array<{ sourceName: string; entries: number; ok: boolean; error?: string }>>(
        "validate",
        { archives }
      );
      const failed = reports.filter((r) => !r.ok);
      const totalEntries = reports.reduce((acc, r) => acc + r.entries, 0);
      if (failed.length > 0) {
        throw new Error(`Validation failed for: ${failed.map((f) => f.sourceName).join(", ")}`);
      }
      setInspectStatus(`Archive validation passed. ${reports.length} archive(s), ${totalEntries} entries verified.`);
      recordTelemetry({
        at: new Date().toISOString(),
        op: "validate",
        format: inspectFiles.length === 1 ? (inferFormatFromName(inspectFiles[0].name) ?? inspectFormat) : "mixed",
        inputBytes: inspectFiles.reduce((a, b) => a + b.size, 0),
        outputBytes: totalEntries,
        ms: Math.round(performance.now() - started),
      });
    } catch (err: unknown) {
      setInspectError(err instanceof Error ? err.message : "Validation failed.");
    }
  });

  const filteredInspectEntries = useMemo(() => {
    const q = inspectQuery.trim().toLowerCase();
    if (!q) return inspectEntries;
    return inspectEntries.filter((e) => e.name.toLowerCase().includes(q));
  }, [inspectEntries, inspectQuery]);

  const singleInspectFormat = useMemo<ArchiveFormat>(() => {
    if (inspectFiles.length !== 1) return inspectFormat;
    return inferFormatFromName(inspectFiles[0].name) ?? inspectFormat;
  }, [inspectFiles, inspectFormat]);

  const handleDownloadInspectEntry = async (entryName: string) => {
    try {
      if (inspectFiles.length !== 1) throw new Error("Single-entry actions require one selected archive.");
      const bytes = await readFileAsBytesStreaming(inspectFiles[0]);
      const all = await extractArchiveRust(singleInspectFormat, bytes, {
        password: inspectPassword.trim() || undefined,
      });
      const resolved = all.find((item) => item.name === entryName);
      if (!resolved) throw new Error(`Entry not found: ${entryName}`);
      downloadBytes(resolved.name.split("/").pop() || resolved.name, resolved.bytes, "application/octet-stream");
    } catch (err: unknown) {
      setInspectError(err instanceof Error ? err.message : "Unable to save entry.");
    }
  };

  const handlePreviewInspectEntry = async (entryName: string) => {
    try {
      setPreviewError(null);
      setPreviewPath(entryName);
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
        setPreviewImageUrl(null);
      }
      if (inspectFiles.length !== 1) throw new Error("Single-entry actions require one selected archive.");
      const bytes = await readFileAsBytesStreaming(inspectFiles[0]);
      const all = await extractArchiveRust(singleInspectFormat, bytes, {
        password: inspectPassword.trim() || undefined,
      });
      const resolved = all.find((item) => item.name === entryName);
      if (!resolved) throw new Error(`Entry not found: ${entryName}`);
      const lower = entryName.toLowerCase();
      if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(lower)) {
        const mime = lower.endsWith(".svg")
          ? "image/svg+xml"
          : lower.endsWith(".png")
            ? "image/png"
            : lower.endsWith(".webp")
              ? "image/webp"
              : lower.endsWith(".gif")
                ? "image/gif"
                : "image/jpeg";
        const url = URL.createObjectURL(new Blob([Uint8Array.from(resolved.bytes)], { type: mime }));
        setPreviewKind("image");
        setPreviewImageUrl(url);
        setPreviewText("");
        return;
      }

      if (!isLikelyTextFile(entryName)) {
        throw new Error("Preview is available for text and common image files only.");
      }
      const maxPreviewBytes = 1024 * 200;
      const slice = resolved.bytes.slice(0, maxPreviewBytes);
      const text = new TextDecoder().decode(slice);
      if (lower.endsWith(".json")) {
        try {
          setPreviewText(JSON.stringify(JSON.parse(text), null, 2));
          setPreviewKind("json");
          return;
        } catch {
        }
      }
      if (lower.endsWith(".xml")) {
        setPreviewKind("xml");
        setPreviewText(text.replace(/></g, ">\n<"));
        return;
      }
      if (lower.endsWith(".csv")) {
        setPreviewKind("csv");
        const rows = text.split(/\r?\n/).slice(0, 40);
        setPreviewText(rows.join("\n"));
        return;
      }
      setPreviewKind("text");
      setPreviewText(text);
    } catch (err: unknown) {
      setPreviewText("");
      setPreviewImageUrl(null);
      setPreviewError(err instanceof Error ? err.message : "Unable to preview this entry.");
    }
  };

  const handleToggleEntrySelection = (entryName: string) => {
    setSelectedEntryNames((prev) => {
      const next = new Set(prev);
      if (next.has(entryName)) next.delete(entryName);
      else next.add(entryName);
      return next;
    });
  };

  const handleExtractSelectedEntries = async () => runMaybeQueued("Extract selected", async () => {
    try {
      if (inspectFiles.length !== 1) throw new Error("Select a single archive for partial extraction.");
      if (selectedEntryNames.size === 0) throw new Error("Select at least one file entry.");
      const selected = Array.from(selectedEntryNames);
      let files: ArchiveInputFile[] = [];
      const all = await run<ArchiveInputFile[]>("extract", { 
        archives: [{
          sourceName: inspectFiles[0].name,
          format: singleInspectFormat,
          file: inspectFiles[0]
        }],
        password: inspectPassword.trim() || undefined
      });
      const map = new Map(all.map((f) => [f.name, f]));
      files = selected.map((name) => {
        const found = map.get(name);
        if (!found) throw new Error(`Entry not found: ${name}`);
        return found;
      });
      setExtracted(files);
      setExtractStatus(`Extracted ${files.length} selected file(s).`);
    } catch (err: unknown) {
      const isPwdError = err instanceof Error && (err.message.includes("password") || err.message.includes("decrypt"));
      setExtractError(isPwdError ? "Password needed or incorrect for extraction." : (err instanceof Error ? err.message : "Failed to extract selected entries."));
    }
  });

  const handleExtractArchive = async () => runMaybeQueued("Extract archives", async () => {
    setExtractError(null);
    setExtractStatus(null);
    try {
      const started = performance.now();
      if (extractFiles.length === 0) throw new Error("Select one or more ZIP/TAR/TGZ files to extract.");

      let files: ArchiveInputFile[];
      if (extractPassword.trim() && extractFiles.length > 1) {
        throw new Error("Password extraction currently supports one ZIP archive at a time.");
      }
      if (extractFiles.length === 1 && extractPassword.trim()) {
        const format = inferFormatFromName(extractFiles[0].name) ?? extractFormat;
        if (format !== "zip") {
          throw new Error("Password extraction is supported for ZIP archives only.");
        }
        const bytes = await readFileAsBytesStreaming(extractFiles[0]);
        files = await extractArchiveRust(format, bytes, { password: extractPassword.trim() });
      } else {
        const archives = extractFiles.map((file) => ({
          sourceName: file.name,
          format: inferFormatFromName(file.name) ?? extractFormat,
          file,
        }));
        files = await run<ArchiveInputFile[]>("extract", { archives });
      }
      setExtracted(files.map(f => ({ ...f, selected: true })));
      setExtractStatus(`Extracted ${files.length} file(s) from ${extractFiles.length} archive(s).`);
      recordTelemetry({
        at: new Date().toISOString(),
        op: "extract",
        format: extractFiles.length === 1 ? (inferFormatFromName(extractFiles[0].name) ?? extractFormat) : "mixed",
        inputBytes: extractFiles.reduce((acc, file) => acc + file.size, 0),
        outputBytes: files.reduce((acc, f) => acc + f.bytes.length, 0),
        ms: Math.round(performance.now() - started),
      });
    } catch (err: unknown) {
      setExtracted([]);
      setExtractError(err instanceof Error ? err.message : "Extraction failed.");
    }
  });

  const handleDownloadSelectedExtracted = () => {
    const selected = (extracted as (ArchiveInputFile & { selected?: boolean })[]).filter(f => f.selected);
    if (selected.length === 0) return;
    
    // Warn if many files are being downloaded at once
    if (selected.length > 5 && !window.confirm(`You are about to download ${selected.length} files. Your browser may request permission for each or block them. Continue?`)) {
      return;
    }

    selected.forEach((file, i) => {
      // Delay slightly to help some browsers handle multiple downloads
      setTimeout(() => {
        downloadBytes(file.name, file.bytes, "application/octet-stream");
      }, i * 250);
    });
  };

  const handlePreviewFile = async (name: string, bytes: Uint8Array) => {
    try {
      setPreviewError(null);
      setPreviewPath(name);
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
        setPreviewImageUrl(null);
      }
      
      const lower = name.toLowerCase();
      if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(lower)) {
        const mime = lower.endsWith(".svg") ? "image/svg+xml" : "image/jpeg";
        const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mime }));
        setPreviewKind("image");
        setPreviewImageUrl(url);
        setPreviewText("");
        return;
      }

      if (!isLikelyTextFile(name)) {
        throw new Error("Preview is available for text and common image files only.");
      }
      
      const maxPreviewBytes = 1024 * 200;
      const slice = bytes.slice(0, maxPreviewBytes);
      const text = new TextDecoder().decode(slice);
      
      if (lower.endsWith(".json")) {
        try {
          setPreviewText(JSON.stringify(JSON.parse(text), null, 2));
          setPreviewKind("json");
          return;
        } catch {}
      }
      
      setPreviewKind("text");
      setPreviewText(text);
    } catch (err: unknown) {
      setPreviewText("");
      setPreviewImageUrl(null);
      setPreviewError(err instanceof Error ? err.message : "Unable to preview this entry.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-(--background) relative font-display text-(--text-primary)">
      <ToolSidebar
        title="Archive Kit"
        items={sections}
        activeId={activeSection}
        onSelect={(id) => setActiveSection(id as typeof activeSection)}
        isOpen={isSidebarOpen}
        onToggle={setSidebarOpen}
      />

      <main className="flex-1 overflow-hidden relative bg-(--background) flex flex-col">
        <header className="h-14 border-b border-(--border-subtle) bg-(--surface-overlay) backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300">
          <div className={cn("flex items-center gap-2 transition-all duration-300", !isSidebarOpen && "pl-12")}>
            <div className="flex items-center text-sm text-(--text-tertiary)">
                                <span className="font-semibold text-(--text-primary) mr-2">Archive Kit</span>
                                <span className="text-(--text-muted)">/</span>
                                <span className="ml-2">{activeLabel}</span>
                              </div>
          </div>
          <ReturnToToolsButton />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="h-full w-full space-y-8">
            <Card className="p-0 bg-(--surface-overlay) border border-(--border-subtle) shadow-sm overflow-hidden">
              <div className="border-b border-(--border-subtle) bg-linear-to-r from-sky-500/5 via-cyan-500/5 to-transparent px-5 py-4">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-semibold text-(--text-primary)">{activeLabel}</h3>
                </div>
                <p className="mt-1 text-xs text-(--text-tertiary)">
                  ZIP/TAR create, list, and extract operations run fully in your browser.
                </p>
                <p className="mt-1 text-[11px] text-sky-600 font-medium">Engine: {engineLabel}</p>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-xl border border-(--border-subtle) bg-(--surface-elevated)/60 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="text-xs text-(--text-secondary)">
                      <input
                        type="checkbox"
                        checked={queueEnabled}
                        onChange={(e) => setQueueEnabled(e.target.checked)}
                        className="mr-1"
                      />
                      background queue mode
                    </label>
                    <span className="text-xs text-(--text-tertiary)">
                      Jobs: {jobs.filter((j) => j.status === "pending").length} pending / {jobs.filter((j) => j.status === "running").length} running
                    </span>
                  </div>
                  {jobs.length > 0 && (
                    <div className="mt-2 max-h-24 overflow-auto space-y-1">
                      {jobs.slice(-6).reverse().map((job) => (
                        <div key={job.id} className="flex items-center justify-between text-xs text-(--text-secondary)">
                          <span>{job.label} - {job.status} (try {job.attempts})</span>
                          {job.status === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "pending" } : j)));
                                setTimeout(() => processQueue(), 0);
                              }}
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isBusy && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-sky-600">
                        Processing... {progress.progress}% ({progress.stage})
                      </div>
                      <Button variant="outline" size="sm" onClick={cancel}>
                        <Ban className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-sky-100 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 transition-all"
                        style={{ width: `${Math.max(3, progress.progress)}%` }}
                      />
                    </div>
                  </div>
                )}

                {activeSection === "create" && (
                  <>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-28">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Format</label>
                        <Select
                          value={createFormat}
                          onChange={(e) => {
                            const next = e.target.value as ArchiveFormat;
                            setCreateFormat(next);
                            setOutputName((prev) =>
                              prev.replace(/(\.zip|\.tar|\.tgz|\.tar\.gz)$/i, "") + `.${next}`
                            );
                          }}
                        >
                          <option value="zip">ZIP</option>
                          <option value="tar">TAR</option>
                          <option value="tgz">TAR.GZ (TGZ)</option>
                        </Select>
                      </div>
                      {createFormat === "zip" && (
                        <div className="w-40 relative group">
                          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                            Compression
                            <Info className="w-3 h-3 text-gray-400 cursor-help" />
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                              Choose between speed and file size. "Best" uses maximal DEFLATE compression.
                            </div>
                          </label>
                          <Select
                            value={zipCompression}
                            onChange={(e) => setZipCompression(e.target.value as ZipCompressionMode)}
                          >
                            <option value="store">Store (No compression)</option>
                            <option value="fast">Fast (Lower ratio)</option>
                            <option value="best">Best (Maximum ratio)</option>
                          </Select>
                        </div>
                      )}
                      <div className="w-72">
                        <label className="text-xs font-semibold uppercase tracking-wider text-(--text-tertiary)">Output Name</label>
                        <Input
                          value={outputName}
                          onChange={(e) => setOutputName(e.target.value)}
                          placeholder={`archive.${createFormat}`}
                        />
                      </div>
                      {createFormat === "zip" && (
                        <div className="w-60">
                          <label className="text-xs font-semibold uppercase tracking-wider text-(--text-tertiary)">Password (AES-256)</label>
                          <Input
                            type="password"
                            value={zipPassword}
                            onChange={(e) => setZipPassword(e.target.value)}
                            placeholder="Optional: encrypt ZIP output"
                          />
                        </div>
                      )}
                      <div className="w-40">
                        <label className="text-xs font-semibold uppercase tracking-wider text-(--text-tertiary)">Build Mode</label>
                        <Select
                          value={deterministic ? "deterministic" : "default"}
                          onChange={(e) => setDeterministic(e.target.value === "deterministic")}
                        >
                          <option value="default">Default</option>
                          <option value="deterministic">Deterministic</option>
                        </Select>
                      </div>
                      <div className="ml-auto">
                        <Button onClick={handleCreateArchive} className="gap-2" disabled={isBusy}>
                          <Download className="w-4 h-4" />
                          Create & Download
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-(--border-subtle) bg-(--surface-elevated)/60 p-4">
                      <label className="text-xs font-semibold uppercase tracking-wider text-(--text-tertiary)">Input Files</label>
                      <div
                        className={cn(
                          "mt-2 rounded-lg border border-dashed p-8 text-center text-xs transition-all",
                          createFiles.length > 0 ? "border-sky-300 bg-sky-50/40" : "border-gray-300 bg-gray-50/60 text-gray-500"
                        )}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          appendSelectedFiles(e.dataTransfer.files);
                        }}
                      >
                        <Archive className="w-8 h-8 mx-auto mb-2 opacity-30 text-sky-600" />
                        <div className="font-medium text-sky-800">
                          {createFiles.length > 0 ? "Drop more files to add to archive" : "Drag and drop files/folders here"}
                        </div>
                        <div className="mt-1 opacity-70">Support for large files up to 2GB</div>
                      </div>
                      <div className="mt-4 grid md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 mb-1">
                            {createFiles.length > 0 ? "Add More Files" : "Choose Files"}
                          </div>
                          <Input
                            type="file"
                            multiple
                            onChange={(e) => appendSelectedFiles(e.target.files)}
                          />
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-(--text-tertiary) mb-1">Add Folder</div>
                          <Input
                            type="file"
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore - webkitdirectory is supported in browsers for folder picking
                            webkitdirectory=""
                            onChange={(e) => appendSelectedFiles(e.target.files)}
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {createFiles.length === 0 ? (
                          <p className="text-sm text-(--text-tertiary)">No files selected.</p>
                        ) : (
                          createFiles.map(({ file, path }, idx) => (
                            <div key={path + file.size + idx} className="grid grid-cols-12 gap-2 items-center">
                              <Input
                                className="col-span-8 h-8 text-xs"
                                value={path}
                                onChange={(e) => updateCreatePath(idx, e.target.value)}
                              />
                              <div className="col-span-3 text-xs text-(--text-tertiary) text-right">{bytesToHuman(file.size)}</div>
                              <div className="col-span-1 text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => removeCreateFile(idx)}
                                  disabled={isBusy}
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {createFiles.length > 0 && (
                          <div className="mt-3 max-h-36 overflow-auto rounded-md border border-(--border-subtle) bg-(--surface-overlay) p-2">
                          {renderTree(buildPathTree(createFiles.map((f) => f.path)))}
                        </div>
                      )}
                      {createFiles.length > 0 && (
                        <div className="mt-3">
                          <Button variant="outline" size="sm" onClick={() => setCreateFiles([])}>
                            Clear Selection
                          </Button>
                        </div>
                      )}
                    </div>

                    {createStatus && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {createStatus}
                      </div>
                    )}
                    {createError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {createError}
                      </div>
                    )}
                    {telemetry.length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-(--text-primary)">Local Benchmark</div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-(--text-secondary) flex items-center gap-1 relative group">
                              <input
                                type="checkbox"
                                checked={telemetryEnabled}
                                onChange={(e) => setTelemetryEnabled(e.target.checked)}
                                className="mr-1"
                              />
                              collect telemetry
                              <Info className="w-3 h-3 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                <strong>Benchmark Mode:</strong> Logs time and compression ratios locally. No data is sent to servers.
                              </div>
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTelemetry([]);
                                writeTelemetry([]);
                              }}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 max-h-32 overflow-auto space-y-1">
                          {telemetry.slice(-8).reverse().map((evt, idx) => (
                            <div key={`${evt.at}-${idx}`} className="text-xs text-(--text-secondary)">
                              {evt.op} [{evt.format}] - {evt.ms}ms - in {bytesToHuman(evt.inputBytes)} / out {bytesToHuman(evt.outputBytes)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeSection === "inspect" && (
                  <>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-28">
                        <label className="text-xs font-semibold uppercase tracking-wider text-(--text-tertiary)">Format</label>
                        <Select value={inspectFormat} onChange={(e) => setInspectFormat(e.target.value as ArchiveFormat)}>
                          <option value="zip">ZIP</option>
                          <option value="tar">TAR</option>
                          <option value="tgz">TGZ</option>
                        </Select>
                      </div>
                      {inspectFormat === "zip" && (
                        <div className="w-64">
                          <label className="text-xs font-semibold uppercase tracking-wider text-(--text-tertiary)">Password (optional)</label>
                          <Input
                            type="password"
                            value={inspectPassword}
                            onChange={(e) => setInspectPassword(e.target.value)}
                            placeholder="For encrypted ZIP preview/save"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-[280px]">
                        <label className="text-xs font-semibold uppercase tracking-wider text-(--text-tertiary)">Archive File</label>
                        <Input
                          type="file"
                          multiple
                          accept=".zip,.tar,.tgz,.tar.gz"
                          onChange={(e) => {
                            const list = Array.from(e.target.files || []);
                            setInspectFiles(list);
                            setInspectEntries([]);
                            if (list.length === 1) {
                              const inferred = inferFormatFromName(list[0].name);
                              if (inferred) setInspectFormat(inferred);
                            }
                          }}
                        />
                      </div>
                      <div className="ml-auto">
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={handleValidateInspectArchive}>Validate Archive</Button>
                          <Button onClick={handleInspectArchive}>List Entries</Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-full sm:w-80">
                        <Input
                          value={inspectQuery}
                          onChange={(e) => setInspectQuery(e.target.value)}
                          placeholder="Search entries by name..."
                        />
                      </div>
                      <span className="text-xs text-(--text-tertiary)">
                        Showing {filteredInspectEntries.length} of {inspectEntries.length}
                      </span>
                      {inspectFiles.length === 1 && selectedEntryNames.size > 0 && (
                        <Button variant="outline" size="sm" onClick={handleExtractSelectedEntries}>
                          Extract Selected ({selectedEntryNames.size})
                        </Button>
                      )}
                    </div>

                    {inspectError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {inspectError}
                      </div>
                    )}
                    {inspectStatus && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {inspectStatus}
                      </div>
                    )}

                    {inspectEntries.length > 0 && (
                      <div className="grid sm:grid-cols-4 gap-2">
                        <div className="rounded-lg border border-(--border-subtle) bg-(--surface-overlay) px-3 py-2 text-xs text-(--text-secondary)">
                          <div className="font-semibold text-(--text-primary)">{inspectEntries.filter((e) => !e.isDirectory).length}</div>
                          Files
                        </div>
                        <div className="rounded-lg border border-(--border-subtle) bg-(--surface-overlay) px-3 py-2 text-xs text-(--text-secondary)">
                          <div className="font-semibold text-(--text-primary)">{inspectEntries.filter((e) => e.isDirectory).length}</div>
                          Folders
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                          <div className="font-semibold text-gray-900">
                            {bytesToHuman(inspectEntries.reduce((a, e) => a + e.size, 0))}
                          </div>
                          Total Size
                        </div>
                        <div className="rounded-lg border border-(--border-subtle) bg-(--surface-overlay) px-3 py-2 text-xs text-(--text-secondary)">
                          <div className="font-semibold text-(--text-primary)">
                            {(() => {
                              const counts = new Map<string, number>();
                              for (const entry of inspectEntries) {
                                counts.set(entry.name, (counts.get(entry.name) ?? 0) + 1);
                              }
                              return Array.from(counts.values()).filter((n) => n > 1).length;
                            })()}
                          </div>
                          Duplicate Paths
                        </div>
                        <div className="rounded-lg border border-(--border-subtle) bg-(--surface-overlay) px-3 py-2 text-xs text-(--text-secondary) sm:col-span-4 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-(--text-primary) flex items-center gap-1">
                              Security Scan
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            </div>
                            <div className="mt-1">
                              Suspicious paths: {
                                inspectEntries.filter((e) => /(^\/|^\.\.|\/\.\.\/|\\\.\.\\)/.test(e.name)).length
                              } | Potential Malware: {
                                inspectEntries.filter((e) => /\.(exe|dll|bat|sh|scr|vbs|js|ps1|msi)$/i.test(e.name)).length
                              }
                            </div>
                          </div>
                          <a 
                            href="https://www.virustotal.com/gui/home/upload" 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] text-sky-600 font-semibold hover:underline"
                          >
                            Verify on VirusTotal ↗
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="grid grid-cols-12 gap-2 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        <div className="col-span-1 text-center">Pick</div>
                        <div className="col-span-4">Name</div>
                        <div className="col-span-2 text-right px-1">Size</div>
                        <div className="col-span-2 text-right px-1">Packed</div>
                        <div className="col-span-1 text-center">Type</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      <div className="max-h-[420px] overflow-y-auto">
                        {filteredInspectEntries.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-(--text-muted)">No entries loaded.</div>
                        ) : (
                          filteredInspectEntries.map((entry) => (
                            <div
                              key={`${entry.name}-${entry.size}-${entry.compressedSize}`}
                              className="grid grid-cols-12 gap-2 px-3 py-2 text-sm border-t border-(--border-subtle)"
                            >
                              <div className="col-span-1 flex justify-center">
                                {!entry.isDirectory && inspectFiles.length === 1 && !entry.name.includes(" :: ") ? (
                                  <input
                                    type="checkbox"
                                    checked={selectedEntryNames.has(entry.name)}
                                    onChange={() => handleToggleEntrySelection(entry.name)}
                                  />
                                ) : null}
                              </div>
                              <div className="col-span-4 truncate font-mono text-[11px]" title={entry.name}>{entry.name}</div>
                              <div className="col-span-2 text-right text-(--text-tertiary) whitespace-nowrap overflow-hidden text-ellipsis">{bytesToHuman(entry.size)}</div>
                              <div className="col-span-2 text-right text-(--text-tertiary) whitespace-nowrap overflow-hidden text-ellipsis">{bytesToHuman(entry.compressedSize)}</div>
                              <div className="col-span-1 text-center text-(--text-muted)">
                                {entry.isDirectory ? (
                                  <span className="bg-gray-100 px-1 rounded">Dir</span>
                                ) : (
                                  <span className="bg-blue-50 text-blue-700 px-1 rounded">File</span>
                                )}
                              </div>
                              <div className="col-span-2 flex justify-end gap-1">
                                {!entry.isDirectory && inspectFiles.length === 1 && !entry.name.includes(" :: ") && (
                                  <>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => handlePreviewInspectEntry(entry.name)}>
                                      Preview
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => handleDownloadInspectEntry(entry.name)}>
                                      Save
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    {previewPath && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-(--text-primary)">Preview: {previewPath}</div>
                          <Button variant="outline" size="sm" onClick={() => setPreviewPath(null)}>Close</Button>
                        </div>
                        {previewError ? (
                          <div className="text-sm text-red-600">{previewError}</div>
                        ) : previewKind === "image" && previewImageUrl ? (
                          <div className="max-h-[260px] overflow-auto rounded-lg border border-(--border-subtle) bg-(--surface-overlay) p-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={previewImageUrl} alt={previewPath} className="max-h-56 w-auto" />
                          </div>
                        ) : (
                          <pre className="max-h-[260px] overflow-auto rounded-lg border border-(--border-subtle) bg-(--surface-overlay) p-3 text-xs text-(--text-secondary) whitespace-pre-wrap font-mono">
                            {previewText.length > 50000 ? previewText.slice(0, 50000) + "\n... [Preview Truncated for Performance]" : previewText}
                          </pre>
                        )}
                      </div>
                    )}
                  </>
                )}

                {activeSection === "extract" && (
                  <>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-28">
                        <label className="text-xs font-semibold uppercase tracking-wider text-(--text-tertiary)">Format</label>
                        <Select value={extractFormat} onChange={(e) => setExtractFormat(e.target.value as ArchiveFormat)}>
                          <option value="zip">ZIP</option>
                          <option value="tar">TAR</option>
                          <option value="tgz">TGZ</option>
                        </Select>
                      </div>
                      {extractFormat === "zip" && (
                        <div className="w-64">
                          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Password (optional)</label>
                          <Input
                            type="password"
                            value={extractPassword}
                            onChange={(e) => setExtractPassword(e.target.value)}
                            placeholder="For encrypted ZIP extraction"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-[280px]">
                        <label className="text-xs font-semibold uppercase tracking-wider text-(--text-tertiary)">Archive File</label>
                        <Input
                          type="file"
                          multiple
                          accept=".zip,.tar,.tgz,.tar.gz"
                          onChange={(e) => {
                            const list = Array.from(e.target.files || []);
                            setExtractFiles(list);
                            setExtracted([]);
                            if (list.length === 1) {
                              const inferred = inferFormatFromName(list[0].name);
                              if (inferred) setExtractFormat(inferred);
                            }
                          }}
                        />
                      </div>
                      <div className="ml-auto">
                        <Button onClick={handleExtractArchive} disabled={isBusy}>Extract Files</Button>
                      </div>
                    </div>
                    {extracted.length > 0 && (
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={handleDownloadSelectedExtracted} 
                          disabled={isBusy}
                          className="text-sky-700 border-sky-200 bg-sky-50"
                        >
                          Download Selected Files
                        </Button>
                        <Button variant="outline" onClick={handleDownloadAllExtracted} disabled={isBusy}>
                          Download All as ZIP
                        </Button>
                      </div>
                    )}
                    {extractStatus && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {extractStatus}
                      </div>
                    )}

                    {extractError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {extractError}
                      </div>
                    )}

                    <div className="rounded-xl border-(--border-subtle) overflow-hidden">
                      <div className="grid grid-cols-12 gap-2 bg-(--surface-elevated) px-3 py-2 text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                        <div className="col-span-1 text-center">Pick</div>
                        <div className="col-span-7">File</div>
                        <div className="col-span-2 text-right">Size</div>
                        <div className="col-span-2 text-right">Action</div>
                      </div>
                      <div className="max-h-[420px] overflow-y-auto">
                        {extracted.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-gray-500">No files extracted.</div>
                        ) : (
                          (extracted as (ArchiveInputFile & { selected?: boolean })[]).map((file, idx) => (
                            <div key={`${file.name}-${idx}`} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm border-t border-gray-100 items-center">
                              <div className="col-span-1 text-center">
                                <input
                                  type="checkbox"
                                  checked={file.selected ?? false}
                                  onChange={(e) => {
                                    const next = [...extracted] as (ArchiveInputFile & { selected?: boolean })[];
                                    next[idx] = { ...next[idx], selected: e.target.checked };
                                    setExtracted(next);
                                  }}
                                />
                              </div>
                              <div className="col-span-7 truncate font-mono text-[11px]">{file.name}</div>
                              <div className="col-span-2 text-right text-gray-600 text-xs">{bytesToHuman(file.bytes.length)}</div>
                              <div className="col-span-2 flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] px-2"
                                  onClick={() => handlePreviewFile(file.name, file.bytes)}
                                >
                                  Preview
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] px-2"
                                  onClick={() => downloadBytes(file.name, file.bytes, "application/octet-stream")}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
