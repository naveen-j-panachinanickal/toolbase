"use client";

import React from "react";
import { LazyEditor as Editor } from "@/components/ui/LazyEditor";
import { ArrowRightLeft, XCircle, CheckCircle2 } from "lucide-react";
import { useActualTheme } from "@/hooks/useActualTheme";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import type { DataFormat } from "@/lib/format-studio";

type ConvertStudioProps = {
  inputFormat: DataFormat;
  outputFormat: DataFormat;
  setInputFormat: (format: DataFormat) => void;
  setOutputFormat: (format: DataFormat) => void;
  inputText: string;
  setInputText: (value: string) => void;
  outputText: string;
  transpileError: string | null;
  onTranspile: () => void;
  formatOptions: Array<{ id: DataFormat; label: string }>;
  languageMap: Record<DataFormat, string>;
};

export function ConvertStudio({
  inputFormat,
  outputFormat,
  setInputFormat,
  setOutputFormat,
  inputText,
  setInputText,
  outputText,
  transpileError,
  onTranspile,
  formatOptions,
  languageMap,
}: ConvertStudioProps) {
  const { editorTheme } = useActualTheme();

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-12 space-y-5">
        <Card className="p-0 overflow-hidden border-(--border-subtle)">
          <div className="border-b border-(--border-subtle) bg-linear-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h3 className="text-sm font-semibold text-(--text-primary)">Convert Studio</h3>
                </div>
                <p className="mt-1 text-xs text-(--text-muted)">Convert structured data between JSON, XML, YAML, and TOML.</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-48">
                <label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Input Format</label>
                <Select value={inputFormat} onChange={(e) => setInputFormat(e.target.value as DataFormat)}>
                  {formatOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="w-48">
                <label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Output Format</label>
                <Select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as DataFormat)}>
                  {formatOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <Button variant="secondary" onClick={onTranspile}>
                  Convert
                </Button>
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Input</label>
                <div className="h-[600px] border-(--border-subtle) rounded-xl overflow-hidden bg-(--surface-secondary)/50">
                  <Editor
                    height="100%"
                    defaultLanguage={languageMap[inputFormat]}
                    value={inputText}
                    onChange={(val) => setInputText(val || "")}
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

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Output</label>
                <div className="h-[360px] border border-(--border-subtle) rounded-xl overflow-hidden bg-(--surface-secondary)/50">
                  <Editor
                    height="100%"
                    defaultLanguage={languageMap[outputFormat]}
                    value={outputText}
                    theme={editorTheme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      padding: { top: 12, bottom: 12 },
                      scrollBeyondLastLine: false,
                      readOnly: true,
                    }}
                  />
                </div>
              </div>
            </div>

            {transpileError && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
                <XCircle className="w-4 h-4" />
                {transpileError}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
