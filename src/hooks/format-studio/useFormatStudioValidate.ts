"use client";

import { useEffect, useMemo, useState } from "react";
import {
  cleanPayload,
  flattenJson,
  formatData,
  normalizeObjectKeys,
  parseToObject,
  unflattenJson,
  validateData,
} from "@/lib/format-studio";
import type { ValidationResult } from "@/lib/format-studio";
import type { ValidationIssue } from "@/components/features/format-studio/types";

export function useFormatStudioValidate() {
  const [validateFormat, setValidateFormat] = useState<"json" | "xml" | "yaml">("json");
  const [validateInput, setValidateInput] = useState("{\n  \"name\": \"OBN\",\n  \"version\": 1\n}");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const formatStats = useMemo(() => {
    const chars = validateInput.length;
    const lines = validateInput ? validateInput.split("\n").length : 0;
    return { chars, lines };
  }, [validateInput]);

  const validationIssues = useMemo<ValidationIssue[]>(() => {
    if (!validationResult) return [];
    const errors = validationResult.errors.map((text) => {
      const lineMatch = text.match(/line\s+(\d+)/i);
      const colMatch = text.match(/column\s+(\d+)/i);
      const pathMatch = text.match(/(?:at|path)\s+([$.a-zA-Z0-9_[\]-]+)/i);
      const lowered = text.toLowerCase();
      const severity: "critical" | "warning" | "info" =
        lowered.includes("invalid") || lowered.includes("error") ? "critical" : "warning";
      let suggestion = "Check syntax and matching brackets/quotes for this section.";
      if (lowered.includes("json")) suggestion = "Ensure property names and string values use double quotes.";
      if (lowered.includes("xml")) suggestion = "Validate matching open/close tags and attribute quote usage.";
      if (lowered.includes("yaml")) suggestion = "Check indentation and avoid tabs in YAML blocks.";
      return {
        severity,
        message: text,
        line: lineMatch ? Number(lineMatch[1]) : null,
        column: colMatch ? Number(colMatch[1]) : null,
        path: pathMatch ? pathMatch[1] : null,
        suggestion,
      };
    });
    const warnings = validationResult.warnings.map((text) => ({
      severity: "warning" as const,
      message: text,
      line: null,
      column: null,
      path: null,
      suggestion: "Review this warning before shipping payloads to downstream systems.",
    }));
    return [...errors, ...warnings];
  }, [validationResult]);

  const jsonToolState = useMemo(() => {
    if (validateFormat !== "json") {
      return {
        canEscape: false,
        canUnescape: false,
        canFlatten: false,
        canUnflatten: false,
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(validateInput);
    } catch {
      return {
        canEscape: true,
        canUnescape: false,
        canFlatten: false,
        canUnflatten: false,
      };
    }

    const isEscapedString = typeof parsed === "string";
    const isFlattenedObject = (() => {
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
      const keys = Object.keys(parsed as Record<string, unknown>);
      return keys.some((k) => k.includes(".") || /^\d+(\.|$)/.test(k));
    })();

    return {
      canEscape: !isEscapedString,
      canUnescape: isEscapedString,
      canFlatten: !isEscapedString && !isFlattenedObject,
      canUnflatten: !isEscapedString && isFlattenedObject,
    };
  }, [validateFormat, validateInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = validateData(validateFormat, validateInput);
      setValidationResult(result);
    }, 400);
    return () => clearTimeout(timer);
  }, [validateFormat, validateInput]);

  const reportValidationError = (message: string) => {
    setValidationResult({ valid: false, errors: [message], warnings: [] });
  };

  const handleFormat = (mode: "beautify" | "minify") => {
    try {
      const formatted = formatData(validateFormat, validateInput, mode);
      setValidateInput(formatted);
    } catch (err: unknown) {
      reportValidationError(err instanceof Error ? err.message : "Formatting failed");
    }
  };

  const handleSortKeys = () => {
    try {
      const formatted = formatData(validateFormat, validateInput, "beautify", { sortKeys: true });
      setValidateInput(formatted);
    } catch (err: unknown) {
      reportValidationError(err instanceof Error ? err.message : "Sort keys failed");
    }
  };

  const handleFormatterPreset = (preset: "clean" | "normalize" | "apiReady") => {
    try {
      const adapter = validateFormat === "json" ? JSON : null;
      let parsed: unknown;
      
      try {
        parsed = parseToObject(validateFormat, validateInput);
      } catch (err) {
        reportValidationError("Input must be valid " + validateFormat.toUpperCase() + " to use presets.");
        return;
      }

      if (preset === "clean") {
        const cleaned = cleanPayload(parsed);
        const formatted = formatData(validateFormat, JSON.stringify(cleaned), "beautify");
        setValidateInput(formatted);
        return;
      }

      if (preset === "normalize") {
        const normalized = normalizeObjectKeys(parsed);
        const formatted = formatData(validateFormat, JSON.stringify(normalized), "beautify");
        setValidateInput(formatted);
        return;
      }

      if (preset === "apiReady") {
        const cleaned = cleanPayload(parsed);
        const normalized = normalizeObjectKeys(cleaned);
        const formatted = formatData(validateFormat, JSON.stringify(normalized), "beautify", { sortKeys: true });
        setValidateInput(formatted);
        return;
      }
    } catch (err: unknown) {
      reportValidationError(err instanceof Error ? err.message : "Preset apply failed");
    }
  };

  const handleJsonEscape = () => {
    try {
      setValidateInput(JSON.stringify(validateInput));
    } catch (err: unknown) {
      reportValidationError(err instanceof Error ? err.message : "JSON escape failed");
    }
  };

  const handleJsonUnescape = () => {
    try {
      const trimmed = validateInput.trim();
      const jsonString = trimmed.startsWith("\"") && trimmed.endsWith("\"")
        ? trimmed
        : `"${trimmed.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
      const unescaped = JSON.parse(jsonString) as string;
      setValidateInput(unescaped);
    } catch (err: unknown) {
      reportValidationError(err instanceof Error ? err.message : "JSON unescape failed");
    }
  };

  const handleFlatten = () => {
    try {
      const parsed = JSON.parse(validateInput);
      const flattened = flattenJson(parsed);
      setValidateInput(JSON.stringify(flattened, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      reportValidationError("Invalid JSON input: " + message);
    }
  };

  const handleUnflatten = () => {
    try {
      const parsed = JSON.parse(validateInput) as Record<string, unknown>;
      const unflattened = unflattenJson(parsed);
      setValidateInput(JSON.stringify(unflattened, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      reportValidationError("Invalid JSON input: " + message);
    }
  };

  return {
    validateFormat,
    validateInput,
    validationResult,
    formatStats,
    validationIssues,
    jsonToolState,
    setValidateFormat,
    setValidateInput,
    setValidationResult,
    handleFormat,
    handleSortKeys,
    handleFormatterPreset,
    handleJsonEscape,
    handleJsonUnescape,
    handleFlatten,
    handleUnflatten,
    reportValidationError,
  };
}
