"use client";

import React from "react";
import { LazyEditor as Editor } from "@/components/ui/LazyEditor";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useActualTheme } from "@/hooks/useActualTheme";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import type { ValidationResult } from "@/lib/format-studio";
import type { ValidationIssue } from "./types";

type ValidatorStudioProps = {
  validateFormat: "json" | "xml" | "yaml";
  setValidateFormat: (format: "json" | "xml" | "yaml") => void;
  validateInput: string;
  setValidateInput: (value: string) => void;
  validationResult: ValidationResult | null;
  validationIssues: ValidationIssue[];
  languageMap: Record<"json" | "xml" | "yaml", string>;
};

export function ValidatorStudio({
  validateFormat,
  setValidateFormat,
  validateInput,
  setValidateInput,
  validationResult,
  validationIssues,
  languageMap,
}: ValidatorStudioProps) {
  const { editorTheme } = useActualTheme();

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-12 space-y-5">
        <Card className="p-0 overflow-hidden border-(--border-subtle)">
          <div className="border-b border-(--border-subtle) bg-linear-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h3 className="text-sm font-semibold text-(--text-primary)">Validator Studio</h3>
                </div>
                <p className="mt-1 text-xs text-(--text-muted)">Validate JSON, XML, and YAML inputs in real time.</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-48">
                <label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Format</label>
                <Select value={validateFormat} onChange={(e) => setValidateFormat(e.target.value as "json" | "xml" | "yaml")}>
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="yaml">YAML</option>
                </Select>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {validationResult?.valid ? (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Valid
                  </div>
                ) : (
                  <div
                    className="group flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold"
                    title={validationResult?.errors?.join("\n") || "Invalid input"}
                  >
                    <XCircle className="w-4 h-4" />
                    Invalid
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="h-[500px] border border-(--border-subtle) rounded-xl overflow-hidden bg-(--surface-secondary)/50">
                <Editor
                  height="100%"
                  defaultLanguage={languageMap[validateFormat]}
                  value={validateInput}
                  onChange={(val) => setValidateInput(val || "")}
                  theme={editorTheme}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    padding: { top: 12, bottom: 12 },
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>

            {(!validationResult?.valid || (validationIssues && validationIssues.length > 0)) && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-(--text-primary)">Validation Issues</h4>
                </div>
                <div className="grid gap-2">
                  {validationIssues.map((issue, idx) => (
                    <div key={idx} className="rounded-lg border border-(--border-subtle) bg-(--surface-secondary) p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-tighter">{issue.path}</span>
                        <span className="text-[10px] text-(--text-muted) px-1.5 py-0.5 bg-(--surface-overlay) rounded-md border border-(--border-subtle)">Line {issue.line}</span>
                      </div>
                      <p className="text-xs text-(--text-primary)">{issue.message}</p>
                    </div>
                  ))}
                  {validationResult?.errors && validationResult.errors.map((err, idx) => (
                    <div key={`err-${idx}`} className="rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-xs text-red-600 dark:text-red-400">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
