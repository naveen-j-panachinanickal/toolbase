"use client";

import React from "react";
import { LazyEditor as Editor } from "@/components/ui/LazyEditor";
import { FileDiff } from "lucide-react";
import { useActualTheme } from "@/hooks/useActualTheme";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import type { DiffEntry } from "@/lib/format-studio";

type DiffLabProps = {
  diffFormat: "json" | "xml" | "yaml";
  setDiffFormat: (format: "json" | "xml" | "yaml") => void;
  diffLeft: string;
  setDiffLeft: (value: string) => void;
  diffRight: string;
  setDiffRight: (value: string) => void;
  diffError: string | null;
  diffEntries: DiffEntry[];
  onRunDiff: () => void;
  languageMap: Record<string, string>;
};

export function DiffLab({
  diffFormat,
  setDiffFormat,
  diffLeft,
  setDiffLeft,
  diffRight,
  setDiffRight,
  diffError,
  diffEntries,
  onRunDiff,
  languageMap,
}: DiffLabProps) {
  const { editorTheme } = useActualTheme();

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-12 space-y-5">
        <Card className="p-0 overflow-hidden border-(--border-subtle)">
          <div className="border-b border-(--border-subtle) bg-linear-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-5 py-4">
            <div className="flex items-center gap-2">
              <FileDiff className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-semibold text-(--text-primary)">Diff Lab</h3>
            </div>
            <p className="mt-1 text-xs text-(--text-muted)">Compare two payloads and inspect structural and value changes.</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Select value={diffFormat} onChange={(e) => setDiffFormat(e.target.value as "json" | "xml" | "yaml")} className="w-28">
                <option value="json">JSON</option>
                <option value="xml">XML</option>
                <option value="yaml">YAML</option>
              </Select>
              <Button variant="secondary" onClick={onRunDiff}>Run Diff</Button>
              <span className="text-xs text-(--text-muted) ml-auto">{diffEntries.length} changes</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Left (Original)</label>
                <div className="h-[600px]  border-(--border-subtle) rounded-xl overflow-hidden bg-(--surface-secondary)/50">
                  <Editor
                    height="100%"
                    defaultLanguage={languageMap[diffFormat]}
                    value={diffLeft}
                    onChange={(val) => setDiffLeft(val || "")}
                    theme={editorTheme}
                    options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Right (Modified)</label>
                <div className="h-[600px] border-(--border-subtle) rounded-xl overflow-hidden bg-(--surface-secondary)/50">
                  <Editor
                    height="100%"
                    defaultLanguage={languageMap[diffFormat]}
                    value={diffRight}
                    onChange={(val) => setDiffRight(val || "")}
                    theme={editorTheme}
                    options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                  />
                </div>
              </div>
            </div>
            {diffError && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">{diffError}</div>}
            {!diffError && (
              <div className="rounded-xl border border-(--border-subtle) overflow-hidden bg-(--surface-overlay)">
                <div className="grid grid-cols-12 gap-2 bg-(--surface-secondary) px-3 py-2 text-xs font-semibold text-(--text-muted) uppercase tracking-wide border-b border-(--border-subtle)">
                  <div className="col-span-1">Type</div>
                  <div className="col-span-4">Path</div>
                  <div className="col-span-3">Left</div>
                  <div className="col-span-4">Right</div>
                </div>
                <div className="max-h-[400px] overflow-auto">
                  {diffEntries.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-500">No differences detected.</div>
                  ) : diffEntries.map((entry, idx) => {
                    const rowStyles =
                      entry.kind === "added" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                        entry.kind === "removed" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" :
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

                    const kindStyles =
                      entry.kind === "added" ? "text-emerald-700 dark:text-emerald-400" :
                        entry.kind === "removed" ? "text-rose-700 dark:text-rose-400" :
                          "text-amber-700 dark:text-amber-400";

                    return (
                      <div key={`${entry.path}-${idx}`} className={`grid grid-cols-12 gap-2 px-3 py-2 border-t text-sm ${rowStyles}`}>
                        <div className={`col-span-1 text-[10px] font-bold uppercase ${kindStyles}`}>{entry.kind}</div>
                        <div className="col-span-4 font-mono text-[11px] truncate opacity-80">{entry.path}</div>
                        <div className="col-span-3 truncate font-mono text-xs">{entry.left}</div>
                        <div className="col-span-4 truncate font-mono text-xs">{entry.right}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
