"use client";

import React, { useMemo, useState } from "react";
import { ToolSidebar, ToolSidebarItem } from "@/components/ui/ToolSidebar";
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";
import { cn } from "@/lib/utils";
import type { DataFormat } from "@/lib/format-studio";
import dynamic from "next/dynamic";

const ConvertStudio = dynamic(() => import("@/components/features/format-studio/ConvertStudio").then(mod => mod.ConvertStudio), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const ValidatorStudio = dynamic(() => import("@/components/features/format-studio/ValidatorStudio").then(mod => mod.ValidatorStudio), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const FormatterStudio = dynamic(() => import("@/components/features/format-studio/FormatterStudio").then(mod => mod.FormatterStudio), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const DiffLab = dynamic(() => import("@/components/features/format-studio/DiffLab").then(mod => mod.DiffLab), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const GeneratorHub = dynamic(() => import("@/components/features/format-studio/GeneratorHub").then(mod => mod.GeneratorHub), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
import {
  ArrowRightLeft,
  CheckCircle2,
  FileDiff,
  Braces,
  Wand2,
} from "lucide-react";
import { useFormatStudioConvert } from "@/hooks/format-studio/useFormatStudioConvert";
import { useFormatStudioValidate } from "@/hooks/format-studio/useFormatStudioValidate";
import { useFormatStudioFormatRecipes } from "@/hooks/format-studio/useFormatStudioFormatRecipes";
import { useFormatStudioDiff } from "@/hooks/format-studio/useFormatStudioDiff";
import { useFormatStudioGenerator } from "@/hooks/format-studio/useFormatStudioGenerator";

const formatOptions: { id: DataFormat; label: string }[] = [
  { id: "json", label: "JSON" },
  { id: "xml", label: "XML" },
  { id: "yaml", label: "YAML" },
  { id: "toml", label: "TOML" },
];

const languageMap: Record<DataFormat, string> = {
  json: "json",
  xml: "xml",
  yaml: "yaml",
  toml: "toml",
};

export default function FormatStudioPage() {
  const [activeTab, setActiveTab] = useState<"transpile" | "validate" | "format" | "diff" | "generate">("transpile");
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const tools: ToolSidebarItem[] = useMemo(() => ([
    { id: "transpile", label: "Convert", icon: ArrowRightLeft },
    { id: "validate", label: "Validators", icon: CheckCircle2 },
    { id: "format", label: "Formatters", icon: Wand2 },
    { id: "diff", label: "Diff Lab", icon: FileDiff },
    { id: "generate", label: "Generator Hub", icon: Braces },
  ]), []);

  const activeToolLabel = tools.find((t) => t.id === activeTab)?.label || "Format Studio";

  const convert = useFormatStudioConvert();
  const validate = useFormatStudioValidate();
  const formatRecipes = useFormatStudioFormatRecipes({
    validateFormat: validate.validateFormat,
    validateInput: validate.validateInput,
    setValidateFormat: validate.setValidateFormat,
    setValidateInput: validate.setValidateInput,
    reportValidationError: validate.reportValidationError,
  });
  const diff = useFormatStudioDiff();
  const generator = useFormatStudioGenerator();

  return (
    <div className="flex h-screen overflow-hidden bg-(--background) relative font-display text-(--text-primary)">
      <ToolSidebar
        title="Format Studio"
        items={tools}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as typeof activeTab)}
        isOpen={isSidebarOpen}
        onToggle={setSidebarOpen}
      />

      <main className="flex-1 overflow-hidden relative bg-(--background)/30 flex flex-col">
        <header className="h-14 border-b border-(--border-subtle) bg-(--surface-overlay)/50 backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300">
          <div className={cn("flex items-center gap-2 transition-all duration-300", !isSidebarOpen && "pl-12")}>
            <div className="flex items-center text-sm text-(--text-muted)">
              <span className="font-semibold text-(--text-primary) mr-2">Format Studio</span>
              <span className="text-(--border-subtle)">/</span>
              <span className="ml-2">{activeToolLabel}</span>
            </div>
          </div>
          <ReturnToToolsButton />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="h-full w-full space-y-8">
            {activeTab === "transpile" && (
              <ConvertStudio
                inputFormat={convert.inputFormat}
                outputFormat={convert.outputFormat}
                setInputFormat={convert.setInputFormat}
                setOutputFormat={convert.setOutputFormat}
                inputText={convert.inputText}
                setInputText={convert.setInputText}
                outputText={convert.outputText}
                transpileError={convert.transpileError}
                onTranspile={convert.handleTranspile}
                formatOptions={formatOptions}
                languageMap={languageMap}
              />
            )}

            {activeTab === "validate" && (
              <ValidatorStudio
                validateFormat={validate.validateFormat}
                setValidateFormat={validate.setValidateFormat}
                validateInput={validate.validateInput}
                setValidateInput={validate.setValidateInput}
                validationResult={validate.validationResult}
                validationIssues={validate.validationIssues}
                languageMap={languageMap as Record<"json" | "xml" | "yaml", string>}
              />
            )}

            {activeTab === "format" && (
              <FormatterStudio
                validateFormat={validate.validateFormat}
                setValidateFormat={validate.setValidateFormat}
                validateInput={validate.validateInput}
                setValidateInput={validate.setValidateInput}
                formatStats={validate.formatStats}
                jsonToolState={validate.jsonToolState}
                onFormat={validate.handleFormat}
                onSortKeys={validate.handleSortKeys}
                onFormatterPreset={validate.handleFormatterPreset}
                onSaveFormatterRecipe={formatRecipes.saveFormatterRecipe}
                onRunDraftRecipe={formatRecipes.runDraftRecipe}
                onFlatten={validate.handleFlatten}
                onUnflatten={validate.handleUnflatten}
                onJsonEscape={validate.handleJsonEscape}
                onJsonUnescape={validate.handleJsonUnescape}
                recipeNameDraft={formatRecipes.recipeNameDraft}
                setRecipeNameDraft={formatRecipes.setRecipeNameDraft}
                recipeStepOpDraft={formatRecipes.recipeStepOpDraft}
                setRecipeStepOpDraft={formatRecipes.setRecipeStepOpDraft}
                recipeStepTargetDraft={formatRecipes.recipeStepTargetDraft}
                setRecipeStepTargetDraft={formatRecipes.setRecipeStepTargetDraft}
                recipeStepsDraft={formatRecipes.recipeStepsDraft}
                onAddRecipeStepDraft={formatRecipes.addRecipeStepDraft}
                onClearRecipeStepsDraft={() => formatRecipes.setRecipeStepsDraft([])}
                onMoveRecipeStep={formatRecipes.moveRecipeStep}
                onRemoveRecipeStep={formatRecipes.removeRecipeStep}
                formatterRecipes={formatRecipes.formatterRecipes}
                onLoadFormatterRecipe={formatRecipes.loadFormatterRecipe}
                onRunSavedRecipe={formatRecipes.runSavedRecipe}
                languageMap={languageMap}
              />
            )}

            {activeTab === "diff" && (
              <DiffLab
                diffFormat={diff.diffFormat}
                setDiffFormat={diff.setDiffFormat}
                diffLeft={diff.diffLeft}
                setDiffLeft={diff.setDiffLeft}
                diffRight={diff.diffRight}
                setDiffRight={diff.setDiffRight}
                diffError={diff.diffError}
                diffEntries={diff.diffEntries}
                onRunDiff={diff.handleRunDiff}
                languageMap={languageMap}
              />
            )}

            {activeTab === "generate" && (
              <GeneratorHub
                docInputFormat={generator.docInputFormat}
                setDocInputFormat={generator.setDocInputFormat}
                docInput={generator.docInput}
                setDocInput={generator.setDocInput}
                docRootName={generator.docRootName}
                setDocRootName={generator.setDocRootName}
                onGenerateDoc={generator.handleGenerateDoc}
                onRoundTripCheck={generator.handleRoundTripCheck}
                onExportBundle={generator.handleExportBundle}
                docOutput={generator.docOutput}
                docGraph={generator.docGraph}
                docGraphDefaultExpandDepth={generator.docGraphDefaultExpandDepth}
                setDocGraphDefaultExpandDepth={generator.setDocGraphDefaultExpandDepth}
                docGraphRestoreExpandDepth={generator.docGraphRestoreExpandDepth}
                setDocGraphRestoreExpandDepth={generator.setDocGraphRestoreExpandDepth}
                setDocGraphExpandedPaths={generator.setDocGraphExpandedPaths}
                setDocGraphModalOpen={generator.setDocGraphModalOpen}
                docGraphModalOpen={generator.isDocGraphModalOpen}
                docGraphMaxDepth={generator.docGraphMaxDepth}
                setDocGraphMaxDepth={generator.setDocGraphMaxDepth}
                docGraphMaxNodes={generator.docGraphMaxNodes}
                setDocGraphMaxNodes={generator.setDocGraphMaxNodes}
                docGraphExpandedPaths={generator.docGraphExpandedPaths}
                docSearchPath={generator.docSearchPath}
                setDocSearchPath={generator.setDocSearchPath}
                docSchemaOutput={generator.docSchemaOutput}
                setDocSchemaOutput={generator.setDocSchemaOutput}
                docOpenApiOutput={generator.docOpenApiOutput}
                setDocOpenApiOutput={generator.setDocOpenApiOutput}
                roundTripReport={generator.roundTripReport}
                languageMap={languageMap}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
