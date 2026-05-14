"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { CopyToClipboard } from "@/components/ui/CopyToClipboard";
import { ToolSidebar } from "@/components/ui/ToolSidebar";
import { cn } from "@/lib/utils";
import type { GenerationProfile, MockFieldType } from "@/lib/data-builder";
import { FlaskConical, Layers3, Plus, Sparkles, Trash2 } from "lucide-react";
import { useDataBuilderLayout, type DataBuilderSection } from "./hooks/use-data-builder-layout";
import { MOCK_FIELD_TYPES, POPULAR_EMAIL_DOMAINS, useDataBuilderFields } from "./hooks/use-data-builder-fields";
import { useDataBuilderBlueprint } from "./hooks/use-data-builder-blueprint";
import { useDataBuilderTesting } from "./hooks/use-data-builder-testing";

export default function DataBuilderPage() {
  const { sections, activeSection, setActiveSection, isSidebarOpen, setSidebarOpen, activeLabel } = useDataBuilderLayout();
  const {
    fields,
    rowCount,
    setRowCount,
    mockFormat,
    setMockFormat,
    mockOutput,
    addField,
    updateField,
    removeField,
    handleGenerateMock,
  } = useDataBuilderFields();
  const {
    blueprintInput,
    setBlueprintInput,
    blueprintCount,
    setBlueprintCount,
    blueprintWithMeta,
    setBlueprintWithMeta,
    blueprintOutput,
    handleGenerateBlueprint,
  } = useDataBuilderBlueprint();
  const {
    schemaInput,
    setSchemaInput,
    schemaCount,
    setSchemaCount,
    schemaSeed,
    setSchemaSeed,
    schemaProfile,
    setSchemaProfile,
    schemaOutput,
    schemaValidation,
    fixturePackText,
    setFixturePackText,
    fixtureRunOutput,
    handleGenerateSchemaData,
    handleExportFixturePack,
    handleImportFixturePack,
    handleRunFixturePack,
  } = useDataBuilderTesting();

  return (
    <div className="flex h-screen overflow-hidden bg-(--background) relative font-display text-(--text-primary)">
      <ToolSidebar
        title="DataBuilder"
        items={sections}
        activeId={activeSection}
        onSelect={(id) => setActiveSection(id as DataBuilderSection)}
        isOpen={isSidebarOpen}
        onToggle={setSidebarOpen}
      />

      <main className="flex-1 overflow-hidden relative bg-(--background) flex flex-col">
        <header className="h-14 border-b border-(--border-subtle) bg-(--surface-overlay) backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300">
          <div className={cn("flex items-center gap-2 transition-all duration-300", !isSidebarOpen && "pl-12")}>
            <div className="flex items-center text-sm text-(--text-tertiary)">
                                <span className="font-semibold text-(--text-primary) mr-2">DataBuilder</span>
                                <span className="text-(--text-muted)">/</span>
                                <span className="ml-2">{activeLabel}</span>
                              </div>
          </div>
          <ReturnToToolsButton />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="h-full w-full space-y-8">
            {activeSection === "fields" && (
              <Card className="p-0 overflow-hidden border border-(--border-subtle)">
                <div className="border-b border-(--border-subtle) bg-linear-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Layers3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h3 className="text-sm font-semibold text-(--text-primary)">Field Builder</h3>
                  </div>
                  <p className="mt-1 text-xs text-(--text-tertiary)">Define fields and constraints to generate realistic mock rows.</p>
                </div>
                <div className="p-5">
                <div className="grid lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="space-y-3">
                      {fields.map((field) => (
                        <div key={field.id} className="flex flex-wrap items-center gap-3">
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            placeholder="field_name"
                            className="flex-1 min-w-[180px]"
                          />
                          <Select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value as MockFieldType })}
                            className="w-44 h-9"
                          >
                            {MOCK_FIELD_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </Select>
                          <Button variant="ghost" onClick={() => removeField(field.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>

                          {(field.type === "int" || field.type === "float") && (
                            <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                              <span>Min</span>
                              <Input
                                type="number"
                                value={field.constraints?.min ?? ""}
                                onChange={(e) => updateField(field.id, { constraints: { ...field.constraints, min: e.target.value === "" ? undefined : Number(e.target.value) } })}
                                className="w-24 bg-(--input-bg) border-(--border-medium)"
                              />
                              <span>Max</span>
                              <Input
                                type="number"
                                value={field.constraints?.max ?? ""}
                                onChange={(e) => updateField(field.id, { constraints: { ...field.constraints, max: e.target.value === "" ? undefined : Number(e.target.value) } })}
                                className="w-24 bg-(--input-bg) border-(--border-medium)"
                              />
                            </div>
                          )}

                          {field.type === "date" && (
                            <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                              <span>Start</span>
                              <Input
                                type="date"
                                value={field.constraints?.start ?? ""}
                                onChange={(e) => updateField(field.id, { constraints: { ...field.constraints, start: e.target.value || undefined } })}
                                className="w-40"
                              />
                              <span>End</span>
                              <Input
                                type="date"
                                value={field.constraints?.end ?? ""}
                                onChange={(e) => updateField(field.id, { constraints: { ...field.constraints, end: e.target.value || undefined } })}
                                className="w-40"
                              />
                            </div>
                          )}

                          {field.type === "string" && (
                            <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                              <span>Min Len</span>
                              <Input
                                type="number"
                                value={field.constraints?.minLength ?? ""}
                                onChange={(e) => updateField(field.id, { constraints: { ...field.constraints, minLength: e.target.value === "" ? undefined : Number(e.target.value) } })}
                                className="w-24"
                              />
                              <span>Max Len</span>
                              <Input
                                type="number"
                                value={field.constraints?.maxLength ?? ""}
                                onChange={(e) => updateField(field.id, { constraints: { ...field.constraints, maxLength: e.target.value === "" ? undefined : Number(e.target.value) } })}
                                className="w-24"
                              />
                            </div>
                          )}

                          {field.type === "email" && (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-(--text-tertiary)">
                              <span className="mr-2">Domains</span>
                              {POPULAR_EMAIL_DOMAINS.map((domain) => {
                                const selected = field.constraints?.domains?.includes(domain);
                                return (
                                  <button
                                    key={domain}
                                    type="button"
                                    onClick={() => {
                                      const current = field.constraints?.domains ?? [];
                                      const next = selected
                                        ? current.filter((d) => d !== domain)
                                        : [...current, domain];
                                      updateField(field.id, { constraints: { ...field.constraints, domains: next.length ? next : undefined } });
                                    }}
                                    className={cn(
                                      "px-2.5 py-1 rounded-full border text-[11px] transition-all",
                                      selected
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-(--surface-overlay) text-(--text-secondary) border-(--border-subtle) hover:border-(--border-medium)"
                                    )}
                                  >
                                    {domain}
                                  </button>
                                );
                              })}
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Add domain (e.g. custom.com)"
                                  className="min-w-[220px] h-9 bg-(--input-bg) border-(--border-medium)"
                                  onKeyDown={(e) => {
                                    if (e.key !== "Enter") return;
                                    const value = (e.currentTarget.value || "").trim();
                                    if (!value) return;
                                    const current = field.constraints?.domains ?? [];
                                    if (!current.includes(value)) {
                                      updateField(field.id, { constraints: { ...field.constraints, domains: [...current, value] } });
                                    }
                                    e.currentTarget.value = "";
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    const input = (e.currentTarget.previousSibling as HTMLInputElement | null);
                                    if (!input) return;
                                    const value = (input.value || "").trim();
                                    if (!value) return;
                                    const current = field.constraints?.domains ?? [];
                                    if (!current.includes(value)) {
                                      updateField(field.id, { constraints: { ...field.constraints, domains: [...current, value] } });
                                    }
                                    input.value = "";
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={addField} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Field
                      </Button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-(--text-tertiary)">Rows</span>
                        <Input
                          type="number"
                          value={rowCount}
                          min={1}
                          max={1000}
                          onChange={(e) => setRowCount(Number(e.target.value))}
                          className="w-24"
                        />
                      </div>
                      <Select value={mockFormat} onChange={(e) => setMockFormat(e.target.value as "json" | "xml")} className="w-32">
                        <option value="json">JSON</option>
                        <option value="xml">XML</option>
                      </Select>
                      <div className="ml-auto flex items-center gap-2">
                        {mockOutput && (
                          <CopyToClipboard text={mockOutput} showText={false} variant="outline" />
                        )}
                        <Button onClick={handleGenerateMock}>Generate</Button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <Textarea
                      value={mockOutput}
                      readOnly
                      placeholder="Generated mock data will appear here..."
                      className="min-h-[360px] font-mono text-xs"
                    />
                  </div>
                </div>
                </div>
              </Card>
            )}

            {activeSection === "blueprint" && (
              <Card className="p-0 overflow-hidden border border-(--border-subtle)">
                <div className="border-b border-(--border-subtle) bg-linear-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h3 className="text-sm font-semibold text-(--text-primary)">Blueprint Generator</h3>
                  </div>
                  <p className="mt-1 text-xs text-(--text-tertiary)">Define nested structures with constraints, null chance, and linked logic.</p>
                </div>
                <div className="p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-(--text-primary)">Blueprint Controls</h3>
                    <p className="text-xs text-(--text-tertiary)">Configure records and metadata, then generate output.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-(--text-tertiary)">
                      <input
                        type="checkbox"
                        checked={blueprintWithMeta}
                        onChange={(e) => setBlueprintWithMeta(e.target.checked)}
                      />
                      Include metadata
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={blueprintCount}
                      onChange={(e) => setBlueprintCount(Number(e.target.value))}
                      className="w-24"
                    />
                    <Button onClick={handleGenerateBlueprint}>Generate</Button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                  <Textarea
                    value={blueprintInput}
                    onChange={(e) => setBlueprintInput(e.target.value)}
                    className="min-h-[320px] font-mono text-xs"
                  />
                  <div className="relative">
                    {blueprintOutput && (
                      <div className="absolute right-3 top-3">
                        <CopyToClipboard text={blueprintOutput} showText={false} variant="outline" />
                      </div>
                    )}
                    <Textarea
                      value={blueprintOutput}
                      readOnly
                      placeholder="Generated records will appear here..."
                      className="min-h-[320px] font-mono text-xs"
                    />
                  </div>
                </div>
                </div>
              </Card>
            )}

            {activeSection === "testing" && (
              <Card className="p-0 overflow-hidden border border-(--border-subtle)">
                <div className="border-b border-(--border-subtle) bg-linear-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-5 py-4">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h3 className="text-sm font-semibold text-(--text-primary)">Testing Studio</h3>
                  </div>
                  <p className="mt-1 text-xs text-(--text-tertiary)">Schema-first deterministic datasets with profile-based generation and fixture pack workflows.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-(--text-tertiary)">Count</span>
                      <Input type="number" min={1} max={50000} value={schemaCount} onChange={(e) => setSchemaCount(Number(e.target.value))} className="w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-(--text-tertiary)">Seed</span>
                      <Input type="number" value={schemaSeed} onChange={(e) => setSchemaSeed(Number(e.target.value))} className="w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-(--text-tertiary)">Profile</span>
                      <Select value={schemaProfile} onChange={(e) => setSchemaProfile(e.target.value as GenerationProfile)} className="w-48">
                        <option value="happy_path">happy_path</option>
                        <option value="edge_cases">edge_cases</option>
                        <option value="invalid_cases">invalid_cases</option>
                        <option value="boundary_values">boundary_values</option>
                        <option value="security_payloads">security_payloads</option>
                      </Select>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {schemaOutput && <CopyToClipboard text={schemaOutput} showText={false} variant="outline" />}
                      <Button onClick={handleGenerateSchemaData}>Generate Dataset</Button>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    <Textarea
                      value={schemaInput}
                      onChange={(e) => setSchemaInput(e.target.value)}
                      className="min-h-[300px] font-mono text-xs"
                    />
                    <Textarea
                      value={schemaOutput}
                      readOnly
                      placeholder="Generated schema-aligned records..."
                      className="min-h-[300px] font-mono text-xs"
                    />
                  </div>

                  {schemaValidation && (
                    <div className="rounded-xl border border-(--border-subtle) bg-(--surface-elevated)/70 p-3 text-xs text-(--text-secondary)">
                      <div className="font-semibold text-(--text-primary) mb-1">Validation Summary</div>
                      <div>Records: {schemaValidation.records}</div>
                      <div>Valid: {schemaValidation.validRecords}</div>
                      <div>Invalid: {schemaValidation.invalidRecords}</div>
                      <div>Errors captured: {schemaValidation.errors.length}</div>
                    </div>
                  )}

                  <div className="rounded-xl border border-(--border-subtle) bg-(--surface-overlay) p-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-(--text-tertiary)">Fixture Packs</div>
                      <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportFixturePack}>Export Pack</Button>
                        <Button variant="outline" size="sm" onClick={handleImportFixturePack}>Import Pack</Button>
                        <Button variant="outline" size="sm" onClick={handleRunFixturePack}>Run Pack</Button>
                      </div>
                    </div>
                    <Textarea
                      value={fixturePackText}
                      onChange={(e) => setFixturePackText(e.target.value)}
                      placeholder="Fixture pack JSON..."
                      className="min-h-[180px] font-mono text-xs"
                    />
                    <Textarea
                      value={fixtureRunOutput}
                      readOnly
                      placeholder="Fixture run report..."
                      className="min-h-[180px] font-mono text-xs"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
