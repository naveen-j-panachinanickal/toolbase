"use client";

import React from "react";
import { useActualTheme } from "@/hooks/useActualTheme";
import { LazyEditor as Editor } from "@/components/ui/LazyEditor";
import { Wand2, Download, Braces } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DataGraph } from "@/components/ui/DataGraph";

type GeneratorHubProps = {
  docInputFormat: "json" | "xml" | "yaml";
  setDocInputFormat: (format: "json" | "xml" | "yaml") => void;
  docInput: string;
  setDocInput: (value: string) => void;
  docRootName: string;
  setDocRootName: (value: string) => void;
  onGenerateDoc: () => void;
  onRoundTripCheck: () => void;
  onExportBundle: () => void;
  docOutput: string;
  docGraph: { value: unknown; error: string | null };
  docGraphDefaultExpandDepth: number;
  setDocGraphDefaultExpandDepth: (value: number) => void;
  docGraphRestoreExpandDepth: number;
  setDocGraphRestoreExpandDepth: (value: number) => void;
  setDocGraphExpandedPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
  setDocGraphModalOpen: (open: boolean) => void;
  docGraphModalOpen: boolean;
  docGraphMaxDepth: number;
  setDocGraphMaxDepth: (value: number) => void;
  docGraphMaxNodes: number;
  setDocGraphMaxNodes: (value: number) => void;
  docGraphExpandedPaths: Set<string>;
  docSearchPath: string;
  setDocSearchPath: (value: string) => void;
  docSchemaOutput: string;
  setDocSchemaOutput: (value: string) => void;
  docOpenApiOutput: string;
  setDocOpenApiOutput: (value: string) => void;
  roundTripReport: string;
  languageMap: Record<string, string>;
};

function GraphControls({
  docGraphDefaultExpandDepth,
  setDocGraphDefaultExpandDepth,
  docGraphMaxDepth,
  setDocGraphMaxDepth,
  docGraphMaxNodes,
  setDocGraphMaxNodes,
}: {
  docGraphDefaultExpandDepth: number;
  setDocGraphDefaultExpandDepth: (value: number) => void;
  docGraphMaxDepth: number;
  setDocGraphMaxDepth: (value: number) => void;
  docGraphMaxNodes: number;
  setDocGraphMaxNodes: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-(--text-muted)">Expand</span>
        <Input
          type="number"
          min={0}
          max={20}
          value={docGraphDefaultExpandDepth}
          onChange={(e) => setDocGraphDefaultExpandDepth(Number(e.target.value))}
          className="w-20"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-(--text-muted)">Depth</span>
        <Input
          type="number"
          min={1}
          max={50}
          value={docGraphMaxDepth}
          onChange={(e) => setDocGraphMaxDepth(Number(e.target.value))}
          className="w-20"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-(--text-muted)">Nodes</span>
        <Input
          type="number"
          min={50}
          max={2000}
          value={docGraphMaxNodes}
          onChange={(e) => setDocGraphMaxNodes(Number(e.target.value))}
          className="w-24"
        />
      </div>
    </div>
  );
}

export function GeneratorHub({
  docInputFormat,
  setDocInputFormat,
  docInput,
  setDocInput,
  docRootName,
  setDocRootName,
  onGenerateDoc,
  onRoundTripCheck,
  onExportBundle,
  docOutput,
  docGraph,
  docGraphDefaultExpandDepth,
  setDocGraphDefaultExpandDepth,
  docGraphRestoreExpandDepth,
  setDocGraphRestoreExpandDepth,
  setDocGraphExpandedPaths,
  setDocGraphModalOpen,
  docGraphModalOpen,
  docGraphMaxDepth,
  setDocGraphMaxDepth,
  docGraphMaxNodes,
  setDocGraphMaxNodes,
  docGraphExpandedPaths,
  docSearchPath,
  setDocSearchPath,
  docSchemaOutput,
  setDocSchemaOutput,
  docOpenApiOutput,
  setDocOpenApiOutput,
  roundTripReport,
  languageMap,
}: GeneratorHubProps) {
  const { editorTheme } = useActualTheme();
  const collapseOrRestore = () => {
    if (docGraphDefaultExpandDepth > 0) {
      setDocGraphRestoreExpandDepth(docGraphDefaultExpandDepth);
      setDocGraphDefaultExpandDepth(0);
      setDocGraphExpandedPaths(new Set());
      return;
    }
    setDocGraphDefaultExpandDepth(Math.max(1, docGraphRestoreExpandDepth));
    setDocGraphExpandedPaths(new Set());
  };

  return (
    <div className="grid lg:grid-cols-1 gap-6">
      <Card className="p-0 bg-(--surface-overlay) border-(--border-subtle) shadow-sm overflow-hidden">
        <div className="border-b border-(--border-subtle) bg-linear-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-5 py-4">
          <div className="flex items-center gap-2">
            <Braces className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-semibold text-(--text-primary)">Generator Hub</h3>
          </div>
          <p className="mt-1 text-xs text-(--text-muted)">Use one input (JSON/XML/YAML) to generate both Markdown and Graph outputs.</p>
        </div>
        <div className="p-5">
          <div className="grid gap-6">
            <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-secondary) p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-(--text-primary)">Input Data</div>
                  <div className="text-[11px] text-(--text-muted)">This input is used for both Markdown and Graph generation.</div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={docInputFormat} onChange={(e) => setDocInputFormat(e.target.value as "json" | "xml" | "yaml")} className="w-28">
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="yaml">YAML</option>
                  </Select>
                  <Input value={docRootName} onChange={(e) => setDocRootName(e.target.value)} placeholder="Root name" className="w-full sm:w-64" />
                  <Button onClick={onGenerateDoc}>Generate</Button>
                  <Button variant="outline" onClick={onRoundTripCheck}>Round-trip Check</Button>
                  <Button variant="outline" onClick={onExportBundle} disabled={!!docGraph.error}>
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export Bundle
                  </Button>
                </div>
              </div>
              {roundTripReport && (
                <div className="mt-3 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-600 dark:text-sky-400">
                  {roundTripReport}
                </div>
              )}
              <div className="mt-3 h-[260px] border border-(--border-subtle) rounded-xl overflow-hidden bg-(--surface-overlay)">
                <Editor
                  height="100%"
                  language={languageMap[docInputFormat]}
                  value={docInput}
                  onChange={(val) => setDocInput(val || "")}
                  theme={editorTheme}
                  options={{ minimap: { enabled: false }, fontSize: 12, padding: { top: 12, bottom: 12 }, scrollBeyondLastLine: false }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-secondary) p-4">
              <div className="text-sm font-semibold text-(--text-primary)">Markdown</div>
              <div className="text-[11px] text-(--text-muted) mt-1">Generated from the Input Data above.</div>
              <Textarea value={docOutput} readOnly placeholder="Generated Markdown will appear here..." className="mt-3 min-h-[220px] font-mono text-xs bg-(--surface-overlay)" />
            </div>

            <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-secondary) p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-(--text-primary)">Graph</div>
                  <div className="text-[11px] text-(--text-muted)">Generated from the same Input Data as connected nodes.</div>
                </div>
                {!docGraph.error && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="h-8 rounded-full px-3 text-xs font-semibold" onClick={collapseOrRestore}>
                      {docGraphDefaultExpandDepth > 0 ? "Collapse Nodes" : "Restore Nodes"}
                    </Button>
                    <Button variant="outline" className="h-8 rounded-full px-3 text-xs font-semibold" onClick={() => setDocGraphModalOpen(true)}>
                      Expand
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-3">
                {docGraph.error ? (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
                    Invalid input: {docGraph.error}
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Input value={docSearchPath} onChange={(e) => setDocSearchPath(e.target.value)} placeholder="Find node path (ex: payload.user)" className="w-full sm:w-80" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const query = docSearchPath.trim().replace(/\./g, "/");
                          if (!query) return;
                          const path = query.startsWith("$") ? query : `$/` + query.replace(/^\//, "");
                          setDocGraphExpandedPaths((prev) => new Set(prev).add(path));
                        }}
                      >
                        Focus Path
                      </Button>
                    </div>
                    <DataGraph
                      value={docGraph.value}
                      rootLabel={docRootName || "root"}
                      className="h-[420px]"
                      maxDepth={docGraphMaxDepth}
                      maxNodes={docGraphMaxNodes}
                      defaultExpandDepth={docGraphDefaultExpandDepth}
                      expandedPaths={docGraphExpandedPaths}
                      onTogglePath={(path) => {
                        setDocGraphExpandedPaths((prev) => {
                          const next = new Set(prev);
                          if (next.has(path)) next.delete(path);
                          else next.add(path);
                          return next;
                        });
                      }}
                    />
                    <div className="mt-3">
                      <GraphControls
                        docGraphDefaultExpandDepth={docGraphDefaultExpandDepth}
                        setDocGraphDefaultExpandDepth={setDocGraphDefaultExpandDepth}
                        docGraphMaxDepth={docGraphMaxDepth}
                        setDocGraphMaxDepth={setDocGraphMaxDepth}
                        docGraphMaxNodes={docGraphMaxNodes}
                        setDocGraphMaxNodes={setDocGraphMaxNodes}
                      />
                    </div>
                    <div className="mt-4 grid lg:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-(--border-subtle) bg-(--surface-overlay) p-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-(--text-muted) mb-2">Schema Summary</div>
                        <Textarea value={docSchemaOutput} onChange={(e) => setDocSchemaOutput(e.target.value)} className="min-h-[180px] font-mono text-xs" />
                      </div>
                      <div className="rounded-xl border border-(--border-subtle) bg-(--surface-overlay) p-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-(--text-muted) mb-2">OpenAPI Snippet</div>
                        <Textarea value={docOpenApiOutput} onChange={(e) => setDocOpenApiOutput(e.target.value)} className="min-h-[180px] font-mono text-xs" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {docGraphModalOpen && (
        <div className="absolute top-14 bottom-0 right-0 left-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setDocGraphModalOpen(false)} />
          <div className="absolute inset-0 pointer-events-none flex items-start justify-start p-0">
            <div
              className="pointer-events-auto w-full h-full bg-(--surface-overlay)/90 backdrop-blur-2xl border border-(--border-subtle) rounded-none shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-14 border-b border-(--border-subtle) bg-(--surface-overlay)/60 backdrop-blur-md flex items-center justify-between px-5">
                <div className="text-sm text-(--text-muted)">
                  <span className="font-semibold text-(--text-primary) mr-2">Graph</span>
                  <span className="text-(--border-subtle)">/</span>
                  <span className="ml-2">Input Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={collapseOrRestore}>
                    {docGraphDefaultExpandDepth > 0 ? "Collapse Nodes" : "Restore Nodes"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDocGraphModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="p-4 md:p-6 flex flex-col gap-3 min-h-0 flex-1">
                {docGraph.error ? (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
                    Invalid input: {docGraph.error}
                  </div>
                ) : (
                  <>
                    <DataGraph
                      value={docGraph.value}
                      rootLabel={docRootName || "root"}
                      className="flex-1 min-h-0"
                      maxDepth={docGraphMaxDepth}
                      maxNodes={docGraphMaxNodes}
                      defaultExpandDepth={docGraphDefaultExpandDepth}
                      expandedPaths={docGraphExpandedPaths}
                      onTogglePath={(path) => {
                        setDocGraphExpandedPaths((prev) => {
                          const next = new Set(prev);
                          if (next.has(path)) next.delete(path);
                          else next.add(path);
                          return next;
                        });
                      }}
                    />
                    <GraphControls
                      docGraphDefaultExpandDepth={docGraphDefaultExpandDepth}
                      setDocGraphDefaultExpandDepth={setDocGraphDefaultExpandDepth}
                      docGraphMaxDepth={docGraphMaxDepth}
                      setDocGraphMaxDepth={setDocGraphMaxDepth}
                      docGraphMaxNodes={docGraphMaxNodes}
                      setDocGraphMaxNodes={setDocGraphMaxNodes}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
